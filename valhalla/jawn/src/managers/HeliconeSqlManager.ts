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

// Extract requested LIMIT count from AST or fallback regex on the raw SQL.
// Returns null if no explicit LIMIT count is found.
function getRequestedLimitCountFromAstOrSql(
  ast: AST,
  rawSql: string
): number | null {
  // Try AST first
  if ((ast as any).type === "select" && (ast as any).limit) {
    const limitValues = (ast as any).limit.value;
    if (Array.isArray(limitValues)) {
      if (limitValues.length === 1) {
        const single = limitValues[0]?.value;
        if (typeof single === "number") {
          return single;
        }
      } else if (limitValues.length === 2) {
        // LIMIT offset, count → the second value is the count
        const countVal = limitValues[1]?.value;
        if (typeof countVal === "number") {
          return countVal;
        }
      }
    }
  }

  // Fallback: basic regex for "LIMIT n" or "LIMIT offset, n"
  // This is intentionally simple and case-insensitive
  const limitRegex = /\blimit\s+(\d+)(?:\s*,\s*(\d+))?/i;
  const match = rawSql.match(limitRegex);
  if (match) {
    const first = Number(match[1]);
    const second = match[2] ? Number(match[2]) : null;
    if (!Number.isNaN(first) && (second === null || Number.isNaN(second) === false)) {
      return second !== null ? second : first;
    }
  }

  return null;
}

export class HeliconeSqlManager {
  private readonly hqlStore: HqlStore;

  constructor(private readonly authParams: AuthParams) {
    this.hqlStore = new HqlStore();
  }

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
  async executeSql(
    sql: string,
    limit: number = 100
  ): Promise<Result<ExecuteSqlResponse, HqlError>> {
    try {
      // Parse SQL to validate and add limit
      let ast;
      try {
        ast = parser.astify(sql, { database: "Postgresql" });
      } catch (parseError) {
        return hqlError(
          HqlErrorCode.SYNTAX_ERROR,
          parseError instanceof Error ? parseError.message : String(parseError)
        );
      }
      
      // Always get first statement to prevent SQL injection
      const normalizedAst = normalizeAst(ast)[0];
      
      // Add limit to prevent excessive data retrieval
      let limitedAst;
      try {
        limitedAst = addLimit(normalizedAst, limit);
      } catch (limitError) {
        const msg = limitError instanceof Error ? limitError.message : String(limitError);
        return hqlError(
          HqlErrorCode.SYNTAX_ERROR,
          `Failed to apply limit: ${msg}`
        );
      }
      
      const firstSql = parser.sqlify(limitedAst, { database: "Postgresql" });

      // Validate SQL for security
      const validatedSql = validateSql(firstSql);
      if (isError(validatedSql)) {
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

      if (isError(result)) {
        const errorString = String(result.error);
        const errorCode = parseClickhouseError(errorString);
        return hqlError(errorCode, errorString);
      }

      return ok({
        rows: result.data ?? [],
        elapsedMilliseconds,
        size: Buffer.byteLength(JSON.stringify(result.data), "utf8"),
        rowCount: result.data?.length ?? 0,
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      return hqlError(
        HqlErrorCode.UNEXPECTED_ERROR,
        errorMessage
      );
    }
  }

  async downloadCsv(sql: string): Promise<Result<string, HqlError>> {
    // TODO Break the below into smaller functions
    try {
      // Parse SQL to check if it already has a limit
      let ast;
      try {
        ast = parser.astify(sql, { database: "Postgresql" });
      } catch (parseError) {
        return hqlError(
          HqlErrorCode.SYNTAX_ERROR,
          parseError instanceof Error ? parseError.message : String(parseError)
        );
      }
      
      // Get first statement
      const normalizedAst = normalizeAst(ast)[0];
      
      // Check if the user's query explicitly requests more than MAX_LIMIT rows
      const requestedLimitCount = getRequestedLimitCountFromAstOrSql(normalizedAst, sql);
      if (requestedLimitCount !== null && requestedLimitCount > MAX_LIMIT) {
        return hqlError(HqlErrorCode.CSV_DOWNLOAD_LIMIT_EXCEEDED);
      }
      
      // If user provided a LIMIT within bounds, skip expensive global count and allow export up to MAX_LIMIT
      if (normalizedAst.type === "select" && requestedLimitCount !== null) {
        // Validate the original SQL for security
        const validatedSql = validateSql(sql);
        if (isError(validatedSql)) {
          return validatedSql;
        }

        // Enforce server-side cap while preserving user's smaller LIMIT
        let limitedAst;
        try {
          limitedAst = addLimit(normalizedAst, MAX_LIMIT);
        } catch (limitError) {
          return hqlError(
            HqlErrorCode.SYNTAX_ERROR,
            `Failed to apply limit: ${limitError instanceof Error ? limitError.message : String(limitError)}`
          );
        }

        const limitedSql = parser.sqlify(limitedAst, { database: "Postgresql" });

        const result = await clickhouseDb.hqlQueryWithContext<Record<string, any>[]>({
          query: limitedSql,
          organizationId: this.authParams.organizationId,
          parameters: [],
        });

        if (isError(result)) {
          const errorString = String(result.error);
          const errorCode = parseClickhouseError(errorString);
          return hqlError(errorCode, errorString);
        }

        if (!result.data?.length) {
          return hqlError(HqlErrorCode.NO_DATA_RETURNED);
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `hql-export-${timestamp}.csv`;

        const uploadResult = await this.hqlStore.uploadCsv(
          filename,
          this.authParams.organizationId,
          result.data
        );

        if (isError(uploadResult)) {
          return hqlError(
            HqlErrorCode.CSV_UPLOAD_FAILED,
            uploadResult.error
          );
        }

        if (!uploadResult.data) {
          return hqlError(HqlErrorCode.CSV_URL_NOT_RETURNED);
        }

        return ok(uploadResult.data);
      }

      // No user LIMIT: perform a bounded count and enforce MAX_LIMIT to prevent massive exports
      {
        // Remove any existing LIMIT clause for the count query
        const countAst = { ...normalizedAst } as any;
        if (countAst.type === "select" && Object.prototype.hasOwnProperty.call(countAst, "limit")) {
          delete countAst.limit;
        }

        const baseSql = parser.sqlify(countAst, { database: "Postgresql" });

        // Validate the base SQL for security
        const validatedBaseSql = validateSql(baseSql);
        if (isError(validatedBaseSql)) {
          return validatedBaseSql;
        }

        // Create a count query to check the total number of rows
        const countSql = `SELECT COUNT(*) as row_count FROM (${baseSql}) as count_query`;

        // Execute the count query
        const countResult = await clickhouseDb.hqlQueryWithContext<{ row_count: number }>({
          query: countSql,
          organizationId: this.authParams.organizationId,
          parameters: [],
        });

        if (isError(countResult)) {
          const errorString = String(countResult.error);
          const errorCode = parseClickhouseError(errorString);
          return hqlError(errorCode, errorString);
        }

        const rowCount = Number(countResult.data?.[0]?.row_count) || 0;

        if (rowCount > MAX_LIMIT) {
          return hqlError(HqlErrorCode.CSV_DOWNLOAD_LIMIT_EXCEEDED);
        }

        if (rowCount === 0) {
          return hqlError(HqlErrorCode.NO_DATA_RETURNED);
        }

        // Execute the actual query with server-side cap
        let limitedAst;
        try {
          limitedAst = addLimit(normalizedAst, MAX_LIMIT);
        } catch (limitError) {
          return hqlError(
            HqlErrorCode.SYNTAX_ERROR,
            `Failed to apply limit: ${limitError instanceof Error ? limitError.message : String(limitError)}`
          );
        }

        const limitedSql = parser.sqlify(limitedAst, { database: "Postgresql" });

        const result = await clickhouseDb.hqlQueryWithContext<Record<string, any>[]>({
          query: limitedSql,
          organizationId: this.authParams.organizationId,
          parameters: [],
        });

        if (isError(result)) {
          const errorString = String(result.error);
          const errorCode = parseClickhouseError(errorString);
          return hqlError(errorCode, errorString);
        }

        if (!result.data?.length) {
          return hqlError(HqlErrorCode.NO_DATA_RETURNED);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `hql-export-${timestamp}.csv`;

        const uploadResult = await this.hqlStore.uploadCsv(
          filename,
          this.authParams.organizationId,
          result.data
        );

        if (isError(uploadResult)) {
          return hqlError(
            HqlErrorCode.CSV_UPLOAD_FAILED,
            uploadResult.error
          );
        }

        if (!uploadResult.data) {
          return hqlError(HqlErrorCode.CSV_URL_NOT_RETURNED);
        }

        return ok(uploadResult.data);
      }

      // Should never reach here because both branches above return
      // Add a final safe guard executing limited query
      let finalAst;
      try {
        finalAst = addLimit(normalizedAst, MAX_LIMIT);
      } catch (limitError) {
        const msg1 = (limitError as any)?.message ?? String(limitError);
        return hqlError(
          HqlErrorCode.SYNTAX_ERROR,
          `Failed to apply limit: ${msg1}`
        );
      }

      const finalSql = parser.sqlify(finalAst, { database: "Postgresql" });
      const finalResult = await clickhouseDb.hqlQueryWithContext<Record<string, any>[]>({
        query: finalSql,
        organizationId: this.authParams.organizationId,
        parameters: [],
      });

      if (isError(finalResult)) {
        const errorString = String(finalResult.error);
        const errorCode = parseClickhouseError(errorString);
        return hqlError(errorCode, errorString);
      }

      if (!finalResult.data?.length) {
        return hqlError(HqlErrorCode.NO_DATA_RETURNED);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `hql-export-${timestamp}.csv`;
      const uploadResult = await this.hqlStore.uploadCsv(
        filename,
        this.authParams.organizationId,
        finalResult.data ?? []
      );

      if (isError(uploadResult)) {
        const uploadErr = (uploadResult as any).error as string;
        return hqlError(
          HqlErrorCode.CSV_UPLOAD_FAILED,
          uploadErr
        );
      }

      if (!uploadResult.data) {
        return hqlError(HqlErrorCode.CSV_URL_NOT_RETURNED);
      }

      return ok(uploadResult.data as string);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e); // TODO Have a cleaner way of defining the error message
      return hqlError(
        HqlErrorCode.UNEXPECTED_ERROR,
        errorMessage
      );
    }
  }
}
