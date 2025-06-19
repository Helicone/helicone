import { ClickHouseTableSchema } from "../controllers/public/heliconeSqlController";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { AuthParams } from "../packages/common/auth/types";
import { err, ok, Result } from "../packages/common/result";
import { AST, Parser, Binary } from "node-sql-parser";

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
      const schema: ClickHouseTableSchema[] = [];

      for (const table_name of CLICKHOUSE_TABLES) {
        const columns = await clickhouseDb.dbQuery<ClickHouseTableRow>(
          `DESCRIBE TABLE ${table_name}`,
          []
        );

        if (columns.error) {
          return err(columns.error);
        }

        schema.push({
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
        });
      }

      return ok(schema);
    } catch (e) {
      return err(String(e));
    }
  }

  // Validate sql
  // Append the where clause to the sql
  // Execute it
  async executeSql(sql: string): Promise<Result<any, string>> {
    const validatedSql = validateSql(sql);
    if (validatedSql.error) {
      return err(validatedSql.error);
    }
    const ast = conertSqlToAst(sql);
    if (ast.error) {
      return err(ast.error);
    }

    if (!ast.data) {
      return err("Invalid SQL");
    }

    const astWithOrgId = ast.data.map((node) =>
      appendOrgIdToAst(node, this.authParams.organizationId)
    );

    const sqlWithOrgId = parser.sqlify(astWithOrgId);

    try {
      const result = await clickhouseDb.dbQuery<any>(sqlWithOrgId, []);
      return ok(result.data);
    } catch (e) {
      return err(String(e));
    }
  }
}

// Check if its SELECT statement query only
// Check if only queries from table request_response_rmt
// Check organization_id is not allowed
function validateSql(sql: string): Result<null, string> {
  const parser = new Parser();
  const opt = { database: "Postgresql" }; // clickhouse not supported yet but closest supported
  const ast = parser.astify(sql, opt);

  if (Array.isArray(ast)) {
    for (const node of ast) {
      if (node.type !== "select") {
        return err("Only select statements are allowed");
      }
    }
  } else {
    if (ast.type !== "select") {
      return err("Only select statements are allowed");
    }
  }

  const tables = parser.tableList(sql, opt);
  for (const table of tables) {
    if (!CLICKHOUSE_TABLES.includes(table.split("::")[2])) {
      return err(
        "Only tables in the list are allowed: " + CLICKHOUSE_TABLES.join(", ")
      );
    }
  }

  const columns = parser.columnList(sql, opt);
  for (const column of columns) {
    if (column.split("::")[2] === "organization_id") {
      return err("Column organization_id is not allowed");
    }
  }

  return ok(null);
}

function conertSqlToAst(sql: string): Result<AST[], string> {
  const parser = new Parser();
  const opt = { database: "Postgresql" }; // clickhouse not supported yet but closest supported
  const ast = parser.astify(sql, opt);
  if (!Array.isArray(ast)) {
    return ok([ast]);
  }
  return ok(ast);
}

function appendOrgIdToAst(ast: AST, orgId: string): AST {
  const orgCondition: Binary = {
    type: "binary_expr",
    operator: "=",
    left: { type: "column_ref", table: null, column: "organization_id" },
    right: { type: "string", value: orgId },
  };

  if (ast.type !== "select") {
    throw new Error("Only select statements are allowed");
  }

  if (!ast.where) {
    // If no WHERE clause exists, add our condition
    ast.where = orgCondition;
  } else {
    // If WHERE exists, combine with AND
    ast.where = {
      type: "binary_expr",
      operator: "AND",
      left: ast.where,
      right: orgCondition,
    };
  }

  return ast;
}
