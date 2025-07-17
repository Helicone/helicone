import {
  ClickHouseTableSchema,
  ExecuteSqlResponse,
} from "../controllers/public/heliconeSqlController";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { AuthParams } from "../packages/common/auth/types";
import { err, ok, Result } from "../packages/common/result";
import { AST, Parser } from "node-sql-parser";
import { HqlStore } from "../lib/stores/HqlStore";

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

function validateSql(sql: string): Result<null, string> {
  const parser = new Parser();

  const tables = parser.tableList(sql, { database: "Postgresql" });

  // type::DB::table
  const invalidTable = tables.find((table) => {
    const [type, _, tableName] = table.split("::");
    return type !== "select" || !CLICKHOUSE_TABLES.includes(tableName);
  });

  if (invalidTable) {
    return err(
      "Only select statements and tables in CLICKHOUSE_TABLES are allowed"
    );
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

export class HeliconeSqlManager {
  private hqlStore: HqlStore;

  constructor(private authParams: AuthParams) {
    this.hqlStore = new HqlStore();
  }

  async getClickhouseSchema(): Promise<
    Result<ClickHouseTableSchema[], string>
  > {
    try {
      const schema: ClickHouseTableSchema[] = await Promise.all(
        CLICKHOUSE_TABLES.map(async (table_name) => {
          const columns = await clickhouseDb.dbQuery<ClickHouseTableRow>(
            `DESCRIBE TABLE ${table_name}`,
            []
          );

          if (columns.error) {
            throw new Error(columns.error);
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
        })
      );

      return ok(schema);
    } catch (e) {
      return err(String(e));
    }
  }

  // Check for SQL injection by only always executing the first sql statement
  // Validate sql by only allowing select statements and tables in CLICKHOUSE_TABLES
  // Add limit check
  // Execute it
  async executeSql(
    sql: string,
    limit: number = 100
  ): Promise<Result<ExecuteSqlResponse, string>> {
    try {
      const ast = parser.astify(sql, { database: "Postgresql" });
      // always get first semi colon to prevent sql injection like snowflake lol
      const normalizedAst = addLimit(normalizeAst(ast)[0], limit);
      const firstSql = parser.sqlify(normalizedAst, { database: "Postgresql" });

      const validatedSql = validateSql(firstSql);

      if (validatedSql.error) {
        return err(validatedSql.error);
      }

      // Create CTEs for each table with organization_id filter
      const cteStatements = CLICKHOUSE_TABLES.map(
        (table) =>
          `${table} AS (SELECT * FROM ${table} WHERE organization_id = { val_0: UUID } )`
      ).join(", ");

      // Wrap the user's SQL with CTEs
      const sqlWithCtes = `
      WITH ${cteStatements}
      ${firstSql}
    `;

      const start = Date.now();

      const result = await clickhouseDb.dbQueryHql<ExecuteSqlResponse["rows"]>(
        sqlWithCtes,
        [this.authParams.organizationId]
      );

      const elapsedMilliseconds = Date.now() - start;
      if (result.error) {
        return err(result.error);
      }

      return ok({
        rows: result.data ?? [],
        elapsedMilliseconds,
        size: Buffer.byteLength(JSON.stringify(result.data), "utf8"),
        rowCount: result.data?.length ?? 0,
      });
    } catch (e) {
      return err(String(e));
    }
  }

  async downloadCsv(sql: string): Promise<Result<string, string>> {
    const result = await this.executeSql(sql, MAX_LIMIT);
    if (result.error) {
      return err(result.error);
    }

    if (!result.data?.rows?.length) {
      return err("No data returned from query");
    }

    // upload to s3
    const uploadResult = await this.hqlStore.uploadCsv(
      `${Date.now()}.csv`,
      this.authParams.organizationId,
      result.data.rows
    );

    if (uploadResult.error || !uploadResult.data) {
      return err(uploadResult.error ?? "Failed to upload csv");
    }

    return ok(uploadResult.data);
  }
}
