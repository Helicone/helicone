import {
  ClickHouseTableSchema,
  ExecuteSqlResponse,
} from "../controllers/public/heliconeSqlController";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { AuthParams } from "../packages/common/auth/types";
import { ok, Result, isError } from "../packages/common/result";
import { HqlError, HqlErrorCode, hqlError, parseClickhouseError } from "../lib/errors/HqlErrors";
import { AST, Parser } from "node-sql-parser";
import { HqlStore } from "../lib/stores/HqlStore";
import { z } from "zod";
import tracer from "../tracer";

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

export class HeliconeSqlManager {
  private readonly hqlStore: HqlStore;

  constructor(private readonly authParams: AuthParams) {
    this.hqlStore = new HqlStore();
  }

  async getClickhouseSchema(): Promise<
    Result<ClickHouseTableSchema[], HqlError>
  > {
    const span = tracer.startSpan("hql.getClickhouseSchema");
    try {
      span.setTag("resource.name", "hql.getClickhouseSchema");
      span.setTag("span.type", "custom");
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
      span.setTag("hql.table_count", schema.length);
      return ok(schema);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      span.setTag("error", true);
      span.setTag("error.message", errorMessage);
      return hqlError(
        HqlErrorCode.SCHEMA_FETCH_FAILED,
        errorMessage
      );
    } finally {
      span.finish();
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
    const span = tracer.startSpan("hql.executeSql");
    span.setTag("resource.name", "hql.executeSql");
    span.setTag("span.type", "custom");
    span.setTag("hql.limit", limit);
    try {
      // Parse SQL to validate and add limit
      let ast;
      try {
        ast = parser.astify(sql, { database: "Postgresql" });
      } catch (parseError) {
        span.setTag("error", true);
        span.setTag(
          "error.message",
          parseError instanceof Error ? parseError.message : String(parseError)
        );
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
        span.setTag("error", true);
        span.setTag(
          "error.message",
          limitError instanceof Error ? limitError.message : String(limitError)
        );
        return hqlError(
          HqlErrorCode.SYNTAX_ERROR,
          `Failed to apply limit: ${limitError instanceof Error ? limitError.message : String(limitError)}`
        );
      }
      
      const firstSql = parser.sqlify(limitedAst, { database: "Postgresql" });

      // Validate SQL for security
      const validatedSql = validateSql(firstSql);
      if (isError(validatedSql)) {
        span.setTag("error", true);
        span.setTag("error.message", validatedSql.error.message);
        return validatedSql;
      }

      const start = Date.now();

      // Execute query with organization context for row-level security
      const result = await clickhouseDb.queryWithContext<ExecuteSqlResponse["rows"]>({
        query: firstSql,
        organizationId: this.authParams.organizationId,
        parameters: [],
      });

      const elapsedMilliseconds = Date.now() - start;
      span.setTag("hql.elapsed_ms", elapsedMilliseconds);
      span.setTag("hql.organization_id", this.authParams.organizationId);
      
      if (isError(result)) {
        const errorCode = parseClickhouseError(result.error);
        span.setTag("error", true);
        span.setTag("error.message", result.error);
        span.setTag("hql.error_code", errorCode);
        return hqlError(errorCode, result.error);
      }

      const rows = result.data ?? [];
      const size = Buffer.byteLength(JSON.stringify(rows), "utf8");
      span.setTag("hql.row_count", rows.length);
      span.setTag("hql.size_bytes", size);
      return ok({
        rows: result.data ?? [],
        elapsedMilliseconds,
        size,
        rowCount: rows.length,
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      span.setTag("error", true);
      span.setTag("error.message", errorMessage);
      return hqlError(
        HqlErrorCode.UNEXPECTED_ERROR,
        errorMessage
      );
    } finally {
      span.finish();
    }
  }

  async downloadCsv(sql: string): Promise<Result<string, HqlError>> {
    const span = tracer.startSpan("hql.downloadCsv");
    span.setTag("resource.name", "hql.downloadCsv");
    span.setTag("span.type", "custom");
    const result = await this.executeSql(sql, MAX_LIMIT);
    if (isError(result)) {
      span.setTag("error", true);
      span.setTag("error.message", result.error.message);
      return result;
    }

    if (!result.data?.rows?.length) {
      span.setTag("hql.no_data", true);
      return hqlError(HqlErrorCode.NO_DATA_RETURNED);
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `hql-export-${timestamp}.csv`;
    
    // Upload to S3
    const uploadResult = await this.hqlStore.uploadCsv(
      filename,
      this.authParams.organizationId,
      result.data.rows
    );

    if (isError(uploadResult)) {
      span.setTag("error", true);
      span.setTag("error.message", uploadResult.error);
      return hqlError(
        HqlErrorCode.CSV_UPLOAD_FAILED,
        uploadResult.error
      );
    }

    if (!uploadResult.data) {
      span.setTag("error", true);
      span.setTag("error.message", "CSV URL not returned");
      return hqlError(HqlErrorCode.CSV_URL_NOT_RETURNED);
    }

    span.setTag("hql.csv_url_generated", true);
    return ok(uploadResult.data);
  }
}
