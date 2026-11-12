import {
  ClickHouseTableSchema,
  ExecuteSqlResponse,
} from "../controllers/public/heliconeSqlController";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { AuthParams } from "../packages/common/auth/types";
import { ok, Result, isError } from "../packages/common/result";
import {
  HqlError,
  HqlErrorCode,
  hqlError,
  parseClickhouseError,
} from "../lib/errors/HqlErrors";
import { AST, Parser } from "node-sql-parser";
import { HqlStore } from "../lib/stores/HqlStore";
import { z } from "zod";
import { S3Client } from "../lib/shared/db/s3Client";
import { DEFAULT_UUID } from "@helicone-package/llm-mapper/types";
import { Traced, withActiveSpan } from "../lib/decorators/tracing";

export const CLICKHOUSE_TABLES = ["request_response_rmt"];
const MAX_LIMIT = 300000;
const parser = new Parser();
interface ClickHouseTableRow {
  name: string;
  type: string;
  default_type?: string;
  default_expression?: string;
  comment?: string;
  codec_expression?: string;
  ttl_expression?: string;
}

const describeRowSchema = z.object({
  name: z.string(),
  type: z.string(),
  default_type: z.string().optional(),
  default_expression: z.string().optional(),
  comment: z.string().optional(),
  codec_expression: z.string().optional(),
  ttl_expression: z.string().optional(),
});

/**
 * ClickHouse table functions. None of these are needed for analytics over
 * request_response_rmt, and several of them (mergeTreeIndex, merge, view,
 * remote, url, file, ...) can read data that the per-organization row policy
 * does not cover. Matched case-insensitively wherever they appear in the query.
 */
export const FORBIDDEN_TABLE_FUNCTIONS = [
  "mergeTreeIndex",
  "mergeTreeProjection",
  "merge",
  "view",
  "viewIfPermitted",
  "viewExplain",
  "dictionary",
  "remote",
  "remoteSecure",
  "cluster",
  "clusterAllReplicas",
  "url",
  "urlCluster",
  "file",
  "fileCluster",
  "s3",
  "s3Cluster",
  "gcs",
  "oss",
  "cosn",
  "hdfs",
  "hdfsCluster",
  "azureBlobStorage",
  "azureBlobStorageCluster",
  "iceberg",
  "icebergS3",
  "icebergAzure",
  "icebergHDFS",
  "icebergLocal",
  "icebergCluster",
  "icebergS3Cluster",
  "icebergAzureCluster",
  "icebergHDFSCluster",
  "deltaLake",
  "deltaLakeS3",
  "deltaLakeAzure",
  "deltaLakeLocal",
  "deltaLakeCluster",
  "hudi",
  "hudiCluster",
  "paimon",
  "paimonCluster",
  "hive",
  "mysql",
  "postgresql",
  "mongodb",
  "redis",
  "odbc",
  "jdbc",
  "sqlite",
  "ytsaurus",
  "arrowFlight",
  "executable",
  "input",
  "loop",
  "values",
  "null",
  "numbers",
  "numbers_mt",
  "zeros",
  "zeros_mt",
  "generateRandom",
  "generate_series",
  "generateSeries",
  "fuzzJSON",
  "fuzzQuery",
  "timeSeriesData",
  "timeSeriesMetrics",
  "timeSeriesTags",
  "timeSeriesSelector",
];

const forbiddenTableFunctionPattern = new RegExp(
  `\\b(${FORBIDDEN_TABLE_FUNCTIONS.join("|")})\\s*\\(`,
  "i"
);

/**
 * Produces a validation "skeleton" of the query by lexing it the way ClickHouse
 * does for the constructs that matter here:
 *   - `-- ...` and `/* ... *\/` comments are replaced by a single space
 *   - the contents of single-quoted string literals are dropped (kept as '')
 *
 * Running keyword/identifier checks on the skeleton means they can neither be
 * fooled by text that only appears inside a literal or comment, nor evaded by
 * hiding real syntax behind something that merely looks like a comment
 * (e.g. `WHERE x = '--' SETTINGS ...`, where `--` is inside a string).
 *
 * Anything whose lexing is not replicated here is rejected outright:
 *   - backtick / double-quoted identifiers (ClickHouse decodes escapes such as
 *     `\x69` inside them, which was used to smuggle the tenant setting name)
 *   - heredoc strings ($tag$...$tag$) and `#` comments
 *   - unterminated literals or comments, NUL bytes, and multiple statements
 */
export function skeletonizeSql(sql: string): Result<string, HqlError> {
  let out = "";
  let i = 0;
  const n = sql.length;

  while (i < n) {
    const c = sql[i];
    const next = i + 1 < n ? sql[i + 1] : "";

    if (c === "'") {
      let j = i + 1;
      let closed = false;
      while (j < n) {
        if (sql[j] === "\\") {
          j += 2;
          continue;
        }
        if (sql[j] === "'") {
          if (j + 1 < n && sql[j + 1] === "'") {
            j += 2;
            continue;
          }
          closed = true;
          break;
        }
        j++;
      }
      if (!closed) {
        return hqlError(
          HqlErrorCode.INVALID_STATEMENT,
          "Unterminated string literal"
        );
      }
      out += "''";
      i = j + 1;
      continue;
    }

    if (c === "-" && next === "-") {
      let j = i + 2;
      while (j < n && sql[j] !== "\n") j++;
      out += " ";
      i = j;
      continue;
    }

    if (c === "/" && next === "*") {
      const close = sql.indexOf("*/", i + 2);
      if (close === -1) {
        return hqlError(
          HqlErrorCode.INVALID_STATEMENT,
          "Unterminated block comment"
        );
      }
      out += " ";
      i = close + 2;
      continue;
    }

    if (c === "`" || c === '"') {
      return hqlError(
        HqlErrorCode.INVALID_STATEMENT,
        "Quoted identifiers are not allowed"
      );
    }

    if (c === "$" || c === "#") {
      return hqlError(
        HqlErrorCode.INVALID_STATEMENT,
        `'${c}' is not allowed outside of string literals`
      );
    }

    if (c === "\0") {
      return hqlError(HqlErrorCode.INVALID_STATEMENT, "NUL byte in query");
    }

    if (c === ";") {
      // Only a trailing semicolon is tolerated.
      if (sql.slice(i + 1).trim().length > 0) {
        return hqlError(
          HqlErrorCode.INVALID_STATEMENT,
          "Multiple statements are not allowed"
        );
      }
      i = n;
      continue;
    }

    out += c;
    i++;
  }

  return ok(out);
}

export function validateSql(sql: string): Result<null, HqlError> {
  const skeleton = skeletonizeSql(sql);
  if (isError(skeleton)) {
    return skeleton;
  }
  const stripped = skeleton.data.trim();

  // Must start with SELECT (after stripping comments/whitespace)
  if (!/^SELECT\b/i.test(stripped)) {
    const firstWord = stripped.match(/^\w+/)?.[0]?.toUpperCase() ?? "unknown";
    return hqlError(
      HqlErrorCode.INVALID_STATEMENT,
      `Found ${firstWord} statement`
    );
  }

  // Reject any DML/DDL keywords that shouldn't appear in read-only queries, and
  // any attempt to change settings: the tenant row policy is keyed off a
  // session setting, so query-level SETTINGS must never be accepted.
  const forbidden =
    /\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|REPLACE|MERGE|EXEC|EXECUTE|GRANT|REVOKE|SET|SETTINGS|ATTACH|DETACH|OPTIMIZE|KILL|RENAME|EXCHANGE)\b/i;
  const forbiddenMatch = stripped.match(forbidden);
  if (forbiddenMatch) {
    return hqlError(
      HqlErrorCode.INVALID_STATEMENT,
      `Found ${forbiddenMatch[0].toUpperCase()} statement`
    );
  }

  // Table functions can appear anywhere a table can (FROM, JOIN, comma joins,
  // subqueries); block them wherever they occur.
  const tableFunctionMatch = stripped.match(forbiddenTableFunctionPattern);
  if (tableFunctionMatch) {
    return hqlError(
      HqlErrorCode.INVALID_TABLE,
      `Table function '${tableFunctionMatch[1]}' is not allowed`
    );
  }

  // Every FROM / JOIN target must be either a parenthesised subquery or exactly
  // one of the allowlisted tables (bare, unqualified, not a function call).
  const tableRefPattern = /\b(?:FROM|JOIN)\b\s*/gi;
  let match;
  while ((match = tableRefPattern.exec(stripped)) !== null) {
    const rest = stripped.slice(match.index + match[0].length);

    if (rest.startsWith("(")) {
      const inner = rest.replace(/^[\s(]+/, "");
      if (!/^(SELECT|WITH)\b/i.test(inner)) {
        return hqlError(
          HqlErrorCode.INVALID_TABLE,
          "Only subqueries are allowed in parentheses after FROM/JOIN"
        );
      }
      continue;
    }

    // Numeric / string operands (e.g. `substring(x FROM 1)`) are not tables.
    if (/^(\d|'')/.test(rest)) {
      continue;
    }

    const ident = rest.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*([.(])?/);
    if (!ident) {
      return hqlError(
        HqlErrorCode.INVALID_TABLE,
        "Could not determine the table referenced after FROM/JOIN"
      );
    }
    const tableName = ident[1];
    if (!CLICKHOUSE_TABLES.includes(tableName)) {
      return hqlError(
        HqlErrorCode.INVALID_TABLE,
        `Table '${tableName}' is not allowed. Allowed tables: ${CLICKHOUSE_TABLES.join(", ")}`
      );
    }
    if (ident[2] === "(") {
      return hqlError(
        HqlErrorCode.INVALID_TABLE,
        `Table function '${tableName}(...)' is not allowed`
      );
    }
    if (ident[2] === ".") {
      return hqlError(
        HqlErrorCode.INVALID_TABLE,
        "Database-qualified table names are not allowed"
      );
    }
  }

  return ok(null);
}

function addLimit(ast: AST, limit: number): AST {
  if (ast.type !== "select") {
    throw new Error("Only select statements are allowed");
  }

  // If there's already a limit, ensure it doesn't exceed the limit
  if (ast.limit && ast.limit.value.length > 0) {
    if (ast.limit.value.length === 1) {
      const currentLimit = ast.limit.value[0]?.value;
      if (typeof currentLimit === "number") {
        ast.limit.value[0].value = Math.min(currentLimit, limit);
      }
    } else if (ast.limit.value.length === 2) {
      // Double LIMIT: LIMIT offset, count
      const currentCount = ast.limit.value[1]?.value;
      if (typeof currentCount === "number") {
        ast.limit.value[1].value = Math.min(currentCount, limit);
      }
    }
  } else {
    // No existing limit, add one with 1000
    ast.limit = {
      seperator: ",",
      value: [
        {
          type: "number",
          value: limit,
        },
      ],
    };
  }

  return ast;
}

function normalizeAst(ast: AST | AST[]): AST[] {
  if (Array.isArray(ast)) {
    return ast;
  }

  return [ast];
}

/**
 * Fallback for when node-sql-parser can't parse ClickHouse-specific syntax.
 * Appends or clamps a LIMIT clause directly on the raw SQL string.
 */
function applyLimitToRawSql(sql: string, limit: number): string {
  const trimmed = sql.trimEnd().replace(/;+$/, "").trimEnd();

  // Check if there's already a LIMIT clause (handles: LIMIT N, LIMIT N,M, LIMIT M OFFSET N)
  const limitMatch = trimmed.match(/\bLIMIT\s+(\d+)(?:\s*,\s*(\d+))?(?:\s+OFFSET\s+\d+)?\s*$/i);
  if (limitMatch) {
    // There's a limit — clamp it
    const existingLimit = parseInt(limitMatch[2] ?? limitMatch[1], 10);
    if (existingLimit <= limit) return trimmed;
    // Replace just the number portion
    const numToReplace = limitMatch[2] ?? limitMatch[1];
    const lastIndex = trimmed.lastIndexOf(numToReplace);
    return trimmed.slice(0, lastIndex) + String(limit) + trimmed.slice(lastIndex + numToReplace.length);
  }

  return `${trimmed} LIMIT ${limit}`;
}

export class HeliconeSqlManager {
  private readonly hqlStore: HqlStore;
  private readonly s3Client: S3Client;

  constructor(private readonly authParams: AuthParams) {
    this.hqlStore = new HqlStore();
    this.s3Client = new S3Client(
      process.env.S3_ACCESS_KEY || undefined,
      process.env.S3_SECRET_KEY || undefined,
      process.env.S3_ENDPOINT_PUBLIC ?? process.env.S3_ENDPOINT ?? "",
      process.env.S3_BUCKET_NAME ?? "",
      (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2"
    );
  }

  @Traced(
    "hql.getClickHouseSchema",
    ({ thisArg }) => ({
      organizationId: thisArg.authParams.organizationId,
      service: "helicone-sql",
      operation: "getClickhouseSchema",
      "tables.count": CLICKHOUSE_TABLES.length,
    })
  )
  async getClickhouseSchema(): Promise<
    Result<ClickHouseTableSchema[], HqlError>
  > {
    try {
      const schemaPromises = CLICKHOUSE_TABLES.map(async (table_name) => {
        const columns = await clickhouseDb.dbQuery<ClickHouseTableRow>(
          `DESCRIBE TABLE ${table_name}`,
          [],
          describeRowSchema
        );

        if (isError(columns)) {
          throw new Error(`Failed to describe table ${table_name}: ${columns.error}`);
        }

        return {
          table_name,
          columns:
            columns.data
              ?.map((col: ClickHouseTableRow) => ({
                name: col.name,
                type: col.type,
                default_type: col.default_type,
                default_expression: col.default_expression,
                comment: col.comment,
                codec_expression: col.codec_expression,
                ttl_expression: col.ttl_expression,
              }))
              .filter((col) => col.name !== "organization_id") ?? [],
        };
      });
      
      const schema = await Promise.all(schemaPromises);
      
      const totalColumns = schema.reduce((sum, table) => sum + table.columns.length, 0);
      withActiveSpan()?.setTag("schema.total_columns", totalColumns);
      withActiveSpan()?.setTag("schema.tables", CLICKHOUSE_TABLES.join(","));
      
      return ok(schema);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      return hqlError(
        HqlErrorCode.SCHEMA_FETCH_FAILED,
        errorMessage
      );
    }
  }

  // Check for SQL injection by only always executing the first sql statement
  // Validate sql by only allowing select statements and tables in CLICKHOUSE_TABLES
  // Add limit check
  // Execute it
  @Traced(
    "hql.executeSql",
    ({ thisArg, args }) => ({
      organizationId: thisArg.authParams.organizationId,
      service: "helicone-sql",
      operation: "executeSql",
      "sql.length": (args[0] as string)?.length || 0,
      "sql.limit": (args[1] as number) ?? 100,
    })
  )
  async executeSql(
    sql: string,
    limit: number = 100
  ): Promise<Result<ExecuteSqlResponse, HqlError>> {
    withActiveSpan()?.setTag("sql.query", sql.substring(0, 200));
    try {
      // Validate SQL for security first (regex-based, handles ClickHouse syntax)
      const validatedSqlEarly = validateSql(sql);
      if (isError(validatedSqlEarly)) {
        withActiveSpan()?.setTag("error.type", validatedSqlEarly.error.code);
        withActiveSpan()?.setTag("error.phase", "validation");
        withActiveSpan()?.setTag("error.message", validatedSqlEarly.error.message);
        return validatedSqlEarly;
      }

      // Apply LIMIT: try AST-based first (more precise), fall back to string manipulation
      // for ClickHouse-specific syntax that node-sql-parser can't handle
      let firstSql: string;
      try {
        const ast = parser.astify(sql, { database: "Postgresql" });
        const normalizedAst = normalizeAst(ast)[0];
        const limitedAst = addLimit(normalizedAst, limit);
        firstSql = parser.sqlify(limitedAst, { database: "Postgresql" });
      } catch {
        // node-sql-parser can't handle ClickHouse-specific syntax (map subscripts,
        // arrayJoin, etc.) — fall back to appending/clamping LIMIT in raw SQL
        firstSql = applyLimitToRawSql(sql, limit);
      }
      withActiveSpan()?.setTag("sql.processed", firstSql.substring(0, 200));

      const start = Date.now();

      // Execute query with organization context for row-level security
      const result = await clickhouseDb.hqlQueryWithContext<
        ExecuteSqlResponse["rows"]
      >({
        query: firstSql,
        organizationId: this.authParams.organizationId,
        parameters: [],
      });

      const elapsedMilliseconds = Date.now() - start;
      withActiveSpan()?.setTag("execution.elapsed_ms", elapsedMilliseconds);

      if (isError(result)) {
        const errorString = String(result.error);
        const errorCode = parseClickhouseError(errorString);
        withActiveSpan()?.setTag("error.type", errorCode);
        withActiveSpan()?.setTag("error.phase", "clickhouse_execution");
        withActiveSpan()?.setTag("error.message", errorString);
        return hqlError(errorCode, errorString);
      }

      // Enrich results with S3 bodies if request_body or response_body columns are present
      const rows = result.data ?? [];
      const enrichmentStart = Date.now();
      const enrichedRows = await this.enrichResultsWithS3Bodies(rows);
      const enrichmentTime = Date.now() - enrichmentStart;
      
      const responseSize = Buffer.byteLength(JSON.stringify(enrichedRows), "utf8");
      
      withActiveSpan()?.setTag("result.row_count", enrichedRows.length);
      withActiveSpan()?.setTag("result.size_bytes", responseSize);
      withActiveSpan()?.setTag("result.elapsed_ms", elapsedMilliseconds);
      withActiveSpan()?.setTag("enrichment.elapsed_ms", enrichmentTime);
      withActiveSpan()?.setTag("enrichment.s3_enriched", enrichmentTime > 10);

      return ok({
        rows: enrichedRows,
        elapsedMilliseconds,
        size: responseSize,
        rowCount: enrichedRows.length,
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      withActiveSpan()?.setTag("error.phase", "general");
      withActiveSpan()?.setTag("error.message", errorMessage);
      return hqlError(HqlErrorCode.UNEXPECTED_ERROR, errorMessage);
    }
  }

  // Admin version that bypasses org-level row filtering
  // Only to be used by admin endpoints with proper authentication
  @Traced(
    "hql.executeAdminSql",
    ({ thisArg, args }) => ({
      organizationId: thisArg.authParams.organizationId,
      service: "helicone-sql",
      operation: "executeAdminSql",
      "sql.length": (args[0] as string)?.length || 0,
      "sql.limit": (args[1] as number) ?? 100,
    })
  )
  async executeAdminSql(
    sql: string,
    limit: number = 100
  ): Promise<Result<ExecuteSqlResponse, HqlError>> {
    withActiveSpan()?.setTag("sql.query", sql.substring(0, 200));
    withActiveSpan()?.setTag("admin_query", true);
    try {
      // Validate SQL for security first (regex-based, handles ClickHouse syntax)
      const validatedSqlEarly = validateSql(sql);
      if (isError(validatedSqlEarly)) {
        withActiveSpan()?.setTag("error.type", validatedSqlEarly.error.code);
        withActiveSpan()?.setTag("error.phase", "validation");
        withActiveSpan()?.setTag("error.message", validatedSqlEarly.error.message);
        return validatedSqlEarly;
      }

      // Apply LIMIT: try AST-based first, fall back to string manipulation
      let firstSql: string;
      try {
        const ast = parser.astify(sql, { database: "Postgresql" });
        const normalizedAst = normalizeAst(ast)[0];
        const limitedAst = addLimit(normalizedAst, limit);
        firstSql = parser.sqlify(limitedAst, { database: "Postgresql" });
      } catch {
        firstSql = applyLimitToRawSql(sql, limit);
      }
      withActiveSpan()?.setTag("sql.processed", firstSql.substring(0, 200));

      const start = Date.now();

      // Execute query WITHOUT organization context to bypass row-level security
      // Uses prod_user instead of hql_user to access all data
      const result = await clickhouseDb.dbQuery<Record<string, any>>(
        firstSql,
        []
      );

      const elapsedMilliseconds = Date.now() - start;
      withActiveSpan()?.setTag("execution.elapsed_ms", elapsedMilliseconds);

      if (isError(result)) {
        const errorString = String(result.error);
        const errorCode = parseClickhouseError(errorString);
        withActiveSpan()?.setTag("error.type", errorCode);
        withActiveSpan()?.setTag("error.phase", "clickhouse_execution");
        withActiveSpan()?.setTag("error.message", errorString);
        return hqlError(errorCode, errorString);
      }

      // For admin queries, skip S3 enrichment to avoid cross-org access issues
      // Admin queries shouldn't need request/response bodies
      const rows = result.data ?? [];

      const responseSize = Buffer.byteLength(JSON.stringify(rows), "utf8");

      withActiveSpan()?.setTag("result.row_count", rows.length);
      withActiveSpan()?.setTag("result.size_bytes", responseSize);
      withActiveSpan()?.setTag("result.elapsed_ms", elapsedMilliseconds);

      return ok({
        rows,
        elapsedMilliseconds,
        size: responseSize,
        rowCount: rows.length,
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      withActiveSpan()?.setTag("error.phase", "general");
      withActiveSpan()?.setTag("error.message", errorMessage);
      return hqlError(HqlErrorCode.UNEXPECTED_ERROR, errorMessage);
    }
  }

  private async enrichResultsWithS3Bodies(
    rows: Record<string, any>[]
  ): Promise<Record<string, any>[]> {
    // Early return for edge cases
    if (!rows || rows.length === 0) {
      return rows;
    }

    // Check if rows have request_id field
    if (!rows[0].hasOwnProperty('request_id')) {
      return rows;
    }

    // Process rows in batches for better performance
    const BATCH_SIZE = 10;
    const enrichedRows: Record<string, any>[] = [];
    
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const enrichedBatch = await Promise.all(
        batch.map(row => this.fetchRowBodiesFromS3(row))
      );
      enrichedRows.push(...enrichedBatch);
    }
    
    return enrichedRows;
  }

  private getRequestIdForS3(requestId: string, cacheReferenceId?: string): string {
    // Use cache reference ID if it exists and is not the default UUID
    if (cacheReferenceId && cacheReferenceId !== DEFAULT_UUID) {
      return cacheReferenceId;
    }
    return requestId;
  }

  private async fetchRowBodiesFromS3(
    row: Record<string, any>
  ): Promise<Record<string, any>> {
    try {
      const requestId = row.request_id;
      const requestIdForS3 = this.getRequestIdForS3(requestId, row.cache_reference_id);
      
      // Get signed URL for the request/response body
      const signedUrlResult = await this.s3Client.getRequestResponseBodySignedUrl(
        this.authParams.organizationId,
        requestIdForS3
      );
      
      if (signedUrlResult.error || !signedUrlResult.data) {
        return this.createRowWithNullBodies(row);
      }
      
      // Fetch and parse the body data from S3
      const bodyData = await this.fetchBodyFromS3Url(signedUrlResult.data);
      
      if (!bodyData) {
        console.error(`Failed to fetch S3 content for request ${requestId}`);
        return this.createRowWithNullBodies(row);
      }
      
      return {
        ...row,
        request_body: bodyData.request || null,
        response_body: bodyData.response || null,
      };
    } catch (error) {
      console.error(`Failed to enrich row with S3 bodies:`, error);
      return this.createRowWithNullBodies(row);
    }
  }

  private async fetchBodyFromS3Url(
    signedUrl: string
  ): Promise<{ request: any; response: any } | null> {
    try {
      const response = await fetch(signedUrl);
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch from S3 URL:`, error);
      return null;
    }
  }

  private createRowWithNullBodies(row: Record<string, any>): Record<string, any> {
    return {
      ...row,
      request_body: null,
      response_body: null,
    };
  }

  @Traced(
    "hql.downloadCsv",
    ({ thisArg, args }) => ({
      organizationId: thisArg.authParams.organizationId,
      service: "helicone-sql",
      operation: "downloadCsv",
      "sql.length": (args[0] as string)?.length || 0,
      "sql.limit": MAX_LIMIT,
    })
  )
  async downloadCsv(sql: string): Promise<Result<string, HqlError>> {
    try {
      const result = await this.executeSql(sql, MAX_LIMIT);
      if (isError(result)) {
        withActiveSpan()?.setTag("error.type", result.error.code);
        withActiveSpan()?.setTag("error.phase", "sql_execution");
        withActiveSpan()?.setTag("error.message", result.error.message);
        return result;
      }

      if (!result.data?.rows?.length) {
        withActiveSpan()?.setTag("error.type", "NO_DATA_RETURNED");
        withActiveSpan()?.setTag("error.phase", "data_validation");
        return hqlError(HqlErrorCode.NO_DATA_RETURNED);
      }

      const rowCount = result.data.rows.length;
      withActiveSpan()?.setTag("csv.row_count", rowCount);
      withActiveSpan()?.setTag("csv.data_size_bytes", result.data.size);

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `hql-export-${timestamp}.csv`;
      withActiveSpan()?.setTag("csv.filename", filename);
      
      // Upload to S3
      const uploadStart = Date.now();
      const uploadResult = await this.hqlStore.uploadCsv(
        filename,
        this.authParams.organizationId,
        result.data.rows
      );
      const uploadTime = Date.now() - uploadStart;
      withActiveSpan()?.setTag("csv.upload_time_ms", uploadTime);

      if (isError(uploadResult)) {
        withActiveSpan()?.setTag("error.type", "CSV_UPLOAD_FAILED");
        withActiveSpan()?.setTag("error.phase", "s3_upload");
        withActiveSpan()?.setTag("error.message", uploadResult.error);
        return hqlError(HqlErrorCode.CSV_UPLOAD_FAILED, uploadResult.error);
      }

      if (!uploadResult.data) {
        withActiveSpan()?.setTag("error.type", "CSV_URL_NOT_RETURNED");
        withActiveSpan()?.setTag("error.phase", "url_generation");
        return hqlError(HqlErrorCode.CSV_URL_NOT_RETURNED);
      }

      withActiveSpan()?.setTag("csv.upload_success", true);
      withActiveSpan()?.setTag("csv.url_generated", !!uploadResult.data);

      return ok(uploadResult.data);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      withActiveSpan()?.setTag("error.phase", "general");
      withActiveSpan()?.setTag("error.message", errorMessage);
      return hqlError(HqlErrorCode.UNEXPECTED_ERROR, errorMessage);
    }
  }
}
