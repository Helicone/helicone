import { ClickHouseTableSchema } from "../controllers/public/heliconeSqlController";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { AuthParams } from "../packages/common/auth/types";
import { err, ok, Result } from "../packages/common/result";
import { AST, Parser } from "node-sql-parser";

const CLICKHOUSE_TABLES = ["request_response_rmt", "tags", "cache_metrics"];
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

export class HeliconeSqlManager {
  constructor(private authParams: AuthParams) {}

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
  async executeSql(sql: string): Promise<Result<any, string>> {
    try {
      const ast = parser.astify(sql, { database: "Postgresql" });
      const normalizedAst = normalizeAst(ast)[0];

      // always get first semi colon to prevent sql injection like snowflake lol
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

      const result = await clickhouseDb.dbQuery<any>(sqlWithCtes, [
        this.authParams.organizationId,
      ]);
      return ok(result.data);
    } catch (e) {
      return err(String(e));
    }
  }
}

function validateSql(sql: string): Result<null, string> {
  const parser = new Parser();

  const tables = parser.tableList(sql, { database: "Postgresql" });
  console.log("tables: ", tables);

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

function normalizeAst(ast: AST | AST[]): AST[] {
  if (Array.isArray(ast)) {
    return ast;
  }

  return [ast];
}
