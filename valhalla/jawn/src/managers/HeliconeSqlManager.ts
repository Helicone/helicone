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

// Body columns that can be used with getBody() function
const BODY_COLUMNS = ["request_body", "response_body"] as const;
type BodyColumnName = (typeof BODY_COLUMNS)[number];

interface GetBodyInfo {
  columnName: BodyColumnName;
  alias: string | null;
  originalIndex: number;
}
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

function validateSql(sql: string): Result<null, HqlError> {
  try {
    const tables = parser.tableList(sql, { database: "Postgresql" });

    // type::DB::table
    const invalidTable = tables.find((table) => {
      const [type, _, tableName] = table.split("::");
      return type !== "select" || !CLICKHOUSE_TABLES.includes(tableName);
    });

    if (invalidTable) {
      const [type, _, tableName] = invalidTable.split("::");
      if (type !== "select") {
        return hqlError(
          HqlErrorCode.INVALID_STATEMENT,
          `Found ${type.toUpperCase()} statement`
        );
      }
      return hqlError(
        HqlErrorCode.INVALID_TABLE,
        `Table '${tableName}' is not allowed. Allowed tables: ${CLICKHOUSE_TABLES.join(', ')}`
      );
    }

    return ok(null);
  } catch (e) {
    return hqlError(
      HqlErrorCode.SYNTAX_ERROR,
      String(e)
    );
  }
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
 * Process getBody() function calls in the AST.
 * Transforms: SELECT getBody(request_body) FROM ...
 * Into: SELECT request_body, storage_location, cache_reference_id FROM ...
 *
 * Returns metadata about which columns need S3 enrichment.
 */
function processGetBodyFunctions(ast: AST): {
  modifiedAst: AST;
  getBodyColumns: GetBodyInfo[];
} {
  if (ast.type !== "select") {
    return { modifiedAst: ast, getBodyColumns: [] };
  }

  const getBodyColumns: GetBodyInfo[] = [];
  const columns = ast.columns as any;

  // Handle SELECT * case or non-array columns
  if (!Array.isArray(columns)) {
    return { modifiedAst: ast, getBodyColumns: [] };
  }

  // Track which metadata columns we need to add
  let needsStorageLocation = false;
  let needsCacheReferenceId = false;
  let needsRequestId = false;

  // Check existing columns and detect getBody() calls
  const existingColumnNames = new Set<string>();

  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];

    // Track existing column names
    if (col.expr?.type === "column_ref" && col.expr?.column?.expr?.value) {
      existingColumnNames.add(col.expr.column.expr.value);
    }

    // Detect getBody() function calls
    if (col.expr?.type === "function") {
      const funcName = col.expr?.name?.name?.[0]?.value?.toLowerCase();

      if (funcName === "getbody") {
        // Get the argument (body column name)
        const argValue = col.expr?.args?.value?.[0];
        const bodyColumnName = argValue?.column?.expr?.value || argValue?.column;

        if (!bodyColumnName || !BODY_COLUMNS.includes(bodyColumnName as BodyColumnName)) {
          // Invalid argument - will be caught at execution time
          continue;
        }

        // Record this getBody() call
        getBodyColumns.push({
          columnName: bodyColumnName as BodyColumnName,
          alias: col.as,
          originalIndex: i,
        });

        // Replace getBody(column) with just column
        columns[i] = {
          expr: {
            type: "column_ref",
            table: null,
            column: {
              expr: {
                type: "default",
                value: bodyColumnName,
              },
            },
            collate: null,
          },
          as: col.as,
        } as any;

        // Mark that we need metadata columns
        needsStorageLocation = true;
        needsCacheReferenceId = true;
        needsRequestId = true;
      }
    }
  }

  // Re-check existing columns after transformation
  existingColumnNames.clear();
  for (const col of columns) {
    if (col.expr?.type === "column_ref" && col.expr?.column?.expr?.value) {
      existingColumnNames.add(col.expr.column.expr.value);
    }
  }

  // Add required metadata columns if not present
  const addColumnIfMissing = (columnName: string) => {
    if (!existingColumnNames.has(columnName)) {
      columns.push({
        expr: {
          type: "column_ref",
          table: null,
          column: {
            expr: {
              type: "default",
              value: columnName,
            },
          },
          collate: null,
        },
        as: null,
      } as any);
    }
  };

  if (needsStorageLocation) {
    addColumnIfMissing("storage_location");
  }
  if (needsCacheReferenceId) {
    addColumnIfMissing("cache_reference_id");
  }
  if (needsRequestId) {
    addColumnIfMissing("request_id");
  }

  return { modifiedAst: ast, getBodyColumns };
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
      // Parse SQL to validate and add limit
      let ast;
      try {
        ast = parser.astify(sql, { database: "Postgresql" });
      } catch (parseError) {
        withActiveSpan()?.setTag("error.type", "SYNTAX_ERROR");
        withActiveSpan()?.setTag("error.phase", "parsing");
        const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
        withActiveSpan()?.setTag("error.message", errorMessage);
        return hqlError(HqlErrorCode.SYNTAX_ERROR, errorMessage);
      }
      
      // Always get first statement to prevent SQL injection
      const normalizedAst = normalizeAst(ast)[0];

      // Process getBody() function calls before adding limit
      const { modifiedAst, getBodyColumns } = processGetBodyFunctions(normalizedAst);
      withActiveSpan()?.setTag("getBody.columns_count", getBodyColumns.length);

      // Add limit to prevent excessive data retrieval
      let limitedAst;
      try {
        limitedAst = addLimit(modifiedAst, limit);
      } catch (limitError) {
        withActiveSpan()?.setTag("error.type", "SYNTAX_ERROR");
        withActiveSpan()?.setTag("error.phase", "limit_application");
        const errorMessage = `Failed to apply limit: ${limitError instanceof Error ? limitError.message : String(limitError)}`;
        withActiveSpan()?.setTag("error.message", errorMessage);
        return hqlError(HqlErrorCode.SYNTAX_ERROR, errorMessage);
      }
      
      const firstSql = parser.sqlify(limitedAst, { database: "Postgresql" });
      withActiveSpan()?.setTag("sql.processed", firstSql.substring(0, 200));

      // Validate SQL for security
      const validatedSql = validateSql(firstSql);
      if (isError(validatedSql)) {
        withActiveSpan()?.setTag("error.type", validatedSql.error.code);
        withActiveSpan()?.setTag("error.phase", "validation");
        withActiveSpan()?.setTag("error.message", validatedSql.error.message);
        return validatedSql;
      }

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

      // Enrich results with S3 bodies only if getBody() was used
      const rows = result.data ?? [];
      const enrichmentStart = Date.now();
      const enrichedRows = await this.enrichResultsWithS3Bodies(rows, getBodyColumns);
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
      // Parse SQL to validate and add limit
      let ast;
      try {
        ast = parser.astify(sql, { database: "Postgresql" });
      } catch (parseError) {
        withActiveSpan()?.setTag("error.type", "SYNTAX_ERROR");
        withActiveSpan()?.setTag("error.phase", "parsing");
        const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
        withActiveSpan()?.setTag("error.message", errorMessage);
        return hqlError(HqlErrorCode.SYNTAX_ERROR, errorMessage);
      }

      // Always get first statement to prevent SQL injection
      const normalizedAst = normalizeAst(ast)[0];

      // Add limit to prevent excessive data retrieval
      let limitedAst;
      try {
        limitedAst = addLimit(normalizedAst, limit);
      } catch (limitError) {
        withActiveSpan()?.setTag("error.type", "SYNTAX_ERROR");
        withActiveSpan()?.setTag("error.phase", "limit_application");
        const errorMessage = `Failed to apply limit: ${limitError instanceof Error ? limitError.message : String(limitError)}`;
        withActiveSpan()?.setTag("error.message", errorMessage);
        return hqlError(HqlErrorCode.SYNTAX_ERROR, errorMessage);
      }

      const firstSql = parser.sqlify(limitedAst, { database: "Postgresql" });
      withActiveSpan()?.setTag("sql.processed", firstSql.substring(0, 200));

      // Validate SQL for security
      const validatedSql = validateSql(firstSql);
      if (isError(validatedSql)) {
        withActiveSpan()?.setTag("error.type", validatedSql.error.code);
        withActiveSpan()?.setTag("error.phase", "validation");
        withActiveSpan()?.setTag("error.message", validatedSql.error.message);
        return validatedSql;
      }

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
    rows: Record<string, any>[],
    getBodyColumns: GetBodyInfo[]
  ): Promise<Record<string, any>[]> {
    // Early return if no getBody() columns were requested
    if (getBodyColumns.length === 0 || !rows || rows.length === 0) {
      return rows;
    }

    // Check if rows have required fields for S3 enrichment
    if (!rows[0].hasOwnProperty("request_id")) {
      return rows;
    }

    // Track which body columns need S3 fetching
    const bodyColumnsToFetch = new Set(
      getBodyColumns.map((col) => col.columnName)
    );

    // Process rows in batches for better performance
    const BATCH_SIZE = 10;
    const enrichedRows: Record<string, any>[] = [];

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const enrichedBatch = await Promise.all(
        batch.map((row) =>
          this.enrichRowWithBodies(row, bodyColumnsToFetch)
        )
      );
      enrichedRows.push(...enrichedBatch);
    }

    return enrichedRows;
  }

  private async enrichRowWithBodies(
    row: Record<string, any>,
    bodyColumnsToFetch: Set<BodyColumnName>
  ): Promise<Record<string, any>> {
    const enrichedRow = { ...row };

    // Check storage_location to determine where to fetch body from
    const storageLocation = row.storage_location;

    if (storageLocation === "s3") {
      // Fetch from S3
      const bodyData = await this.fetchBodiesFromS3(row);
      if (bodyData) {
        if (bodyColumnsToFetch.has("request_body")) {
          enrichedRow.request_body = bodyData.request || null;
        }
        if (bodyColumnsToFetch.has("response_body")) {
          enrichedRow.response_body = bodyData.response || null;
        }
      } else {
        // S3 fetch failed, set to null
        for (const col of bodyColumnsToFetch) {
          enrichedRow[col] = null;
        }
      }
    }
    // If storage_location is 'clickhouse' or anything else, use the value already in the row

    // Remove metadata columns that were added for enrichment
    delete enrichedRow.storage_location;
    delete enrichedRow.cache_reference_id;

    return enrichedRow;
  }

  private async fetchBodiesFromS3(
    row: Record<string, any>
  ): Promise<{ request: any; response: any } | null> {
    try {
      const requestId = row.request_id;
      const requestIdForS3 = this.getRequestIdForS3(
        requestId,
        row.cache_reference_id
      );

      // Get signed URL for the request/response body
      const signedUrlResult =
        await this.s3Client.getRequestResponseBodySignedUrl(
          this.authParams.organizationId,
          requestIdForS3
        );

      if (signedUrlResult.error || !signedUrlResult.data) {
        return null;
      }

      // Fetch and parse the body data from S3
      return await this.fetchBodyFromS3Url(signedUrlResult.data);
    } catch (error) {
      console.error(`Failed to fetch bodies from S3:`, error);
      return null;
    }
  }

  private getRequestIdForS3(requestId: string, cacheReferenceId?: string): string {
    // Use cache reference ID if it exists and is not the default UUID
    if (cacheReferenceId && cacheReferenceId !== DEFAULT_UUID) {
      return cacheReferenceId;
    }
    return requestId;
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
