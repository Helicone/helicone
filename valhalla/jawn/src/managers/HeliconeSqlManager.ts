import { ClickHouseTableSchema } from "../controllers/public/heliconeSqlController";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { AuthParams } from "../packages/common/auth/types";
import { err, ok, Result } from "../packages/common/result";
import { AST, Parser, Binary, Select, TableExpr } from "node-sql-parser";

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

    console.log("result: ", sqlWithOrgId);
    try {
      const result = await clickhouseDb.dbQuery<any>(sqlWithOrgId, []);
      return ok(result.data);
    } catch (e) {
      return err(String(e));
    }
  }
}

// Helper function to recursively walk the AST and validate each node
// Only allow SELECT statements with organization_id in the WHERE clause
// Only allow tables in the CLICKHOUSE_TABLES list
// Only allow columns in the CLICKHOUSE_TABLES list
// Only allow subqueries in the WHERE clause
// Only allow UNION, INTERSECT, EXCEPT in the SELECT statement
// Only allow ORDER BY, LIMIT, OFFSET in the SELECT statement
// Only allow GROUP BY in the SELECT statement
function validateAstNode(node: any): Result<null, string> {
  // Base case: if node is null or undefined
  if (!node) {
    return ok(null);
  }

  // Check if this is a SELECT node
  if (node.type === "select") {
    // Validate the current SELECT node
    if (node.from) {
      for (const fromItem of Array.isArray(node.from)
        ? node.from
        : [node.from]) {
        // Check table name if it's a direct table reference
        if (fromItem.table) {
          if (!CLICKHOUSE_TABLES.includes(fromItem.table)) {
            return err(
              "Only tables in the list are allowed: " +
                CLICKHOUSE_TABLES.join(", ")
            );
          }
        }
        // If it's a subquery, recursively validate it
        if (fromItem.expr) {
          const subqueryResult = validateAstNode(fromItem.expr);
          if (subqueryResult.error) {
            return subqueryResult;
          }
        }
      }
    }

    // Check columns for organization_id
    if (node.columns) {
      for (const column of node.columns) {
        if (column.expr && column.expr.column === "organization_id") {
          return err("Column organization_id is not allowed");
        }
      }
    }

    // Recursively check WHERE clause
    if (node.where) {
      const whereResult = validateAstNode(node.where);
      if (whereResult.error) {
        return whereResult;
      }
    }

    // Recursively check subqueries in WITH clause
    if (node.with) {
      for (const withQuery of node.with) {
        const withResult = validateAstNode(withQuery.stmt);
        if (withResult.error) {
          return withResult;
        }
      }
    }

    // Recursively check UNION, INTERSECT, EXCEPT
    if (node.union) {
      for (const unionQuery of node.union) {
        const unionResult = validateAstNode(unionQuery);
        if (unionResult.error) {
          return unionResult;
        }
      }
    }
  }

  return ok(null);
}

function validateSql(sql: string): Result<null, string> {
  const parser = new Parser();
  const opt = { database: "Postgresql" }; // clickhouse not supported yet but closest supported

  try {
    const ast = normalizeAst(parser.astify(sql, opt));

    // Check if any node is not a SELECT
    for (const node of ast) {
      if (node.type !== "select") {
        return err("Only select statements are allowed");
      }

      // Recursively validate each AST node
      const validationResult = validateAstNode(node);
      if (validationResult.error) {
        return validationResult;
      }
    }

    return ok(null);
  } catch (error: any) {
    return err(`SQL parsing error: ${error.message}`);
  }
}

function conertSqlToAst(sql: string): Result<AST[], string> {
  const parser = new Parser();
  const opt = { database: "Postgresql" }; // clickhouse not supported yet but closest supported
  const ast = parser.astify(sql, opt);
  return ok(normalizeAst(ast));
}

function appendOrgIdToAst(ast: AST, orgId: string): AST {
  const orgCondition: Binary = {
    type: "binary_expr",
    operator: "=",
    left: { type: "column_ref", table: null, column: "organization_id" },
    right: { type: "string", value: orgId },
  };

  function appendToNode(node: Select): void {
    if (!node || typeof node !== "object") return;

    // Handle SELECT nodes
    if (node.type === "select") {
      if (!node.where) {
        node.where = orgCondition;
      } else {
        node.where = {
          type: "binary_expr",
          operator: "AND",
          left: node.where,
          right: orgCondition,
        };
      }

      // Recursively check FROM clause for subqueries
      if (node.from) {
        if (Array.isArray(node.from)) {
          node.from.forEach((fromItem) => {
            if ("expr" in fromItem) {
              appendToNode(fromItem.expr.ast);
            }
          });
        } else if (node.from) {
          appendToNode(node.from.expr.ast);
        }
      }
    }

    // Check for subqueries in WHERE clause
    if (node.where) {
      if (node.where.type === "function" && Array.isArray(node.where.args)) {
        node.where.args.forEach((arg) => {
          if (arg.type === "select" && arg.ast) {
            appendToNode(arg.ast);
          }
        });
      }
    }

    // Check for subqueries in WITH clause
    if (node.with) {
      node.with.forEach((withItem: any) => appendToNode(withItem.stmt));
    }
  }

  if (ast.type !== "select") {
    throw new Error("Only select statements are allowed");
  }

  appendToNode(ast);
  return ast;
}

function normalizeAst(ast: AST | AST[]): AST[] {
  if (Array.isArray(ast)) {
    return ast;
  }

  return [ast];
}
