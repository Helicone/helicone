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

  /* ---------------------------- Helper Functions --------------------------- */
  private parseSqlOrError(sql: string): Result<AST | AST[], HqlError> {
    try {
      const ast = parser.astify(sql, { database: "Postgresql" });
      return ok(ast);
    } catch (parseError) {
      return hqlError(
        HqlErrorCode.SYNTAX_ERROR,
        parseError instanceof Error ? parseError.message : String(parseError)
      );
    }
  }

  private firstStatement(ast: AST | AST[]): AST {
    return normalizeAst(ast)[0];
  }

  private addLimitOrError(ast: AST, limit: number): Result<AST, HqlError> {
    try {
      const limited = addLimit(ast, limit);
      return ok(limited);
    } catch (limitError) {
      const msg = (limitError as any)?.message ?? String(limitError);
      return hqlError(HqlErrorCode.SYNTAX_ERROR, `Failed to apply limit: ${msg}`);
    }
  }

  private toPostgresSql(ast: AST): string {
    return parser.sqlify(ast, { database: "Postgresql" });
  }

  private validateSqlOrError(sql: string): Result<null, HqlError> {
    return validateSql(sql);
  }

  private async executeRows(
    sql: string
  ): Promise<Result<Record<string, any>[], HqlError>> {
    const result = await clickhouseDb.hqlQueryWithContext<Record<string, any>[]>({
      query: sql,
      organizationId: this.authParams.organizationId,
      parameters: [],
    });

    if (isError(result)) {
      const errorString = String(result.error);
      const errorCode = parseClickhouseError(errorString);
      return hqlError(errorCode, errorString);
    }

    return ok(result.data ?? []);
  }

  private buildFilename(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `hql-export-${timestamp}.csv`;
  }

  private async uploadCsvRows(
    rows: Record<string, any>[]
  ): Promise<Result<string, HqlError>> {
    const filename = this.buildFilename();
    const uploadResult = await this.hqlStore.uploadCsv(
      filename,
      this.authParams.organizationId,
      rows
    );

    if (isError(uploadResult)) {
      const uploadErr = (uploadResult as any).error as string;
      return hqlError(HqlErrorCode.CSV_UPLOAD_FAILED, uploadErr);
    }

    if (!uploadResult.data) {
      return hqlError(HqlErrorCode.CSV_URL_NOT_RETURNED);
    }

    return ok(uploadResult.data as string);
  }

  private removeLimitFromSelectAst(ast: AST): AST {
    const clone: any = { ...ast };
    if (clone.type === "select" && Object.prototype.hasOwnProperty.call(clone, "limit")) {
      delete clone.limit;
    }
    return clone as AST;
  }

  private async countRowsForNormalizedSelect(
    normalizedAst: AST
  ): Promise<Result<number, HqlError>> {
    const countAst = this.removeLimitFromSelectAst(normalizedAst);
    const baseSql = this.toPostgresSql(countAst);

    const validatedBaseSql = this.validateSqlOrError(baseSql);
    if (isError(validatedBaseSql)) {
      return validatedBaseSql;
    }

    const countSql = `SELECT COUNT(*) as row_count FROM (${baseSql}) as count_query`;
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
    return ok(rowCount);
  }

  async executeSql(
    sql: string,
    limit: number = 100
  ): Promise<Result<ExecuteSqlResponse, HqlError>> {
    try {
      // Parse and normalize
      const astResult = this.parseSqlOrError(sql);
      if (isError(astResult)) return astResult;
      const normalizedAst = this.firstStatement(astResult.data);

      // Add limit to prevent excessive data retrieval
      const limitedAstResult = this.addLimitOrError(normalizedAst, limit);
      if (isError(limitedAstResult)) return limitedAstResult;
      const firstSql = this.toPostgresSql(limitedAstResult.data);

      // Validate SQL for security
      const validatedSql = this.validateSqlOrError(firstSql);
      if (isError(validatedSql)) return validatedSql;

      const start = Date.now();
      const rowsResult = await this.executeRows(firstSql);
      const elapsedMilliseconds = Date.now() - start;

      if (isError(rowsResult)) return rowsResult;

      return ok({
        rows: rowsResult.data,
        elapsedMilliseconds,
        size: Buffer.byteLength(JSON.stringify(rowsResult.data), "utf8"),
        rowCount: rowsResult.data.length,
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
    try {
      // Parse SQL to check if it already has a limit
      const astResult = this.parseSqlOrError(sql);
      if (isError(astResult)) return astResult;
      const normalizedAst = this.firstStatement(astResult.data);

      // Check if the user's query explicitly requests more than MAX_LIMIT rows
      const requestedLimitCount = getRequestedLimitCountFromAstOrSql(normalizedAst, sql);
      if (requestedLimitCount !== null && requestedLimitCount > MAX_LIMIT) {
        return hqlError(HqlErrorCode.CSV_DOWNLOAD_LIMIT_EXCEEDED);
      }

      // If user provided a LIMIT within bounds, skip expensive count and export directly (capped server-side)
      if (normalizedAst.type === "select" && requestedLimitCount !== null) {
        const validatedSql = this.validateSqlOrError(sql);
        if (isError(validatedSql)) return validatedSql;

        const limitedAstResult = this.addLimitOrError(normalizedAst, MAX_LIMIT);
        if (isError(limitedAstResult)) return limitedAstResult;
        const limitedSql = this.toPostgresSql(limitedAstResult.data);

        const rowsResult = await this.executeRows(limitedSql);
        if (isError(rowsResult)) return rowsResult;
        if (!rowsResult.data.length) return hqlError(HqlErrorCode.NO_DATA_RETURNED);

        return this.uploadCsvRows(rowsResult.data);
      }

      // No user LIMIT: perform count and enforce MAX_LIMIT
      const rowCountResult = await this.countRowsForNormalizedSelect(normalizedAst);
      if (isError(rowCountResult)) return rowCountResult;
      const rowCount = rowCountResult.data;

      if (rowCount > MAX_LIMIT) return hqlError(HqlErrorCode.CSV_DOWNLOAD_LIMIT_EXCEEDED);
      if (rowCount === 0) return hqlError(HqlErrorCode.NO_DATA_RETURNED);

      const limitedAstResult = this.addLimitOrError(normalizedAst, MAX_LIMIT);
      if (isError(limitedAstResult)) return limitedAstResult;
      const limitedSql = this.toPostgresSql(limitedAstResult.data);

      const rowsResult = await this.executeRows(limitedSql);
      if (isError(rowsResult)) return rowsResult;
      if (!rowsResult.data.length) return hqlError(HqlErrorCode.NO_DATA_RETURNED);

      return this.uploadCsvRows(rowsResult.data);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      return hqlError(
        HqlErrorCode.UNEXPECTED_ERROR,
        errorMessage
      );
    }
  }
}
