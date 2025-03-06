import { FilterNode, FilterBranch, FilterLeaf } from "./filterDefs";

export interface RequestResponseRMT {
  response_id: string;
  response_created_at: string;
  latency: number;
  status: number;
  completion_tokens: number;
  prompt_tokens: number;
  prompt_cache_write_tokens: number;
  prompt_cache_read_tokens: number;
  model: string;
  request_id: string;
  request_created_at: string;
  user_id: string;
  organization_id: string;
  proxy_key_id: string;
  threat: boolean;
  time_to_first_token: number;
  provider: string;
  country_code: string;
  target_url: string;
  properties: Record<string, string>;
  scores: Record<string, number>;
  request_body: string;
  response_body: string;
  assets: Array<string>;
  updated_at?: string;
}
/**
 * Clean AST structure for filter expressions
 */
export type FilterExpression =
  | AllExpression
  | ConditionExpression
  | AndExpression
  | OrExpression;

type Tables = "request_response_rmt";
type Columns = keyof RequestResponseRMT;

export interface BaseExpression {
  type: string;
}

export interface AllExpression extends BaseExpression {
  type: "all";
}

export interface ConditionExpression extends BaseExpression {
  type: "condition";
  field: {
    table?: string;
    column: string;
    subtype?: "property" | "score";
    key?: string;
  };
  operator: string;
  value: string | number | boolean;
}

export interface AndExpression extends BaseExpression {
  type: "and";
  expressions: FilterExpression[];
}

export interface OrExpression extends BaseExpression {
  type: "or";
  expressions: FilterExpression[];
}

/**
 * Create an "all" expression (matches everything)
 */
export function all(): AllExpression {
  return { type: "all" };
}

/**
 * Create a condition expression
 */
export function condition(
  column: string,
  operator: string,
  value: string | number | boolean
): ConditionExpression {
  return {
    type: "condition",
    field: {
      table: "request_response_rmt",
      column,
    },
    operator,
    value,
  };
}

/**
 * Create an AND expression
 */
export function and(...expressions: FilterExpression[]): AndExpression {
  return {
    type: "and",
    expressions,
  };
}

/**
 * Create an OR expression
 */
export function or(...expressions: FilterExpression[]): OrExpression {
  return {
    type: "or",
    expressions,
  };
}

/**
 * Create a property condition expression
 */
export function propertyCondition(
  key: string,
  operator: string,
  value: string | number | boolean
): ConditionExpression {
  return {
    type: "condition",
    field: {
      table: "request_response_rmt",
      column: "properties",
      subtype: "property",
      key,
    },
    operator,
    value,
  };
}

/**
 * Create a score condition expression
 */
export function scoreCondition(
  key: string,
  operator: string,
  value: string | number | boolean
): ConditionExpression {
  return {
    type: "condition",
    field: {
      table: "request_response_rmt",
      column: "scores",
      subtype: "score",
      key,
    },
    operator,
    value,
  };
}

/**
 * Convert a legacy FilterNode to the new FilterExpression format
 */
export function fromLegacyFilter(filter: FilterNode): FilterExpression {
  if (filter === "all") {
    return all();
  }

  if ((filter as FilterBranch).operator) {
    const branch = filter as FilterBranch;
    const operator = branch.operator;

    if (operator === "and") {
      return and(fromLegacyFilter(branch.left), fromLegacyFilter(branch.right));
    } else if (operator === "or") {
      return or(fromLegacyFilter(branch.left), fromLegacyFilter(branch.right));
    }
  }

  // It's a leaf
  const leaf = filter as FilterLeaf;
  const tableEntries = Object.entries(leaf);

  if (tableEntries.length === 0) {
    return all();
  }

  const [tableName, tableValue] = tableEntries[0];
  const columnEntries = Object.entries(tableValue);

  if (columnEntries.length === 0) {
    return all();
  }

  const [columnName, columnValue] = columnEntries[0];
  const operatorEntries = Object.entries(columnValue as Record<string, any>);

  if (operatorEntries.length === 0) {
    return all();
  }

  const [operatorName, value] = operatorEntries[0];

  return condition(columnName as string, operatorName, value);
}

/**
 * Convert a new FilterExpression to the legacy FilterNode format
 */
export function toLegacyFilter(filter: FilterExpression): FilterNode {
  if (filter.type === "all") {
    return "all";
  }

  if (filter.type === "condition") {
    const condition = filter as ConditionExpression;
    const { field, operator, value } = condition;

    // Create a nested structure: { table: { column: { operator: value } } }
    const operatorObj: Record<string, any> = {};
    operatorObj[operator] = value;

    const columnObj: Record<string, any> = {};
    columnObj[field.column] = operatorObj;

    const tableObj: Record<string, any> = {};
    tableObj[field.table || "request_response_rmt"] = columnObj;

    return tableObj as FilterLeaf;
  }

  if (filter.type === "and" || filter.type === "or") {
    const group = filter as AndExpression | OrExpression;

    if (group.expressions.length === 0) {
      return "all";
    }

    if (group.expressions.length === 1) {
      return toLegacyFilter(group.expressions[0]);
    }

    // Build up the tree from left to right
    let result: FilterNode = toLegacyFilter(group.expressions[0]);

    for (let i = 1; i < group.expressions.length; i++) {
      result = {
        left: result,
        operator: filter.type as "and" | "or",
        right: toLegacyFilter(group.expressions[i]),
      };
    }

    return result;
  }

  return "all";
}

/**
 * Simple builder interface for filters
 */
export const Filter = {
  all,
  condition,
  and,
  or,
  where: condition,
  property: propertyCondition,
  score: scoreCondition,
  fromLegacy: fromLegacyFilter,
  toLegacy: toLegacyFilter,
};

/**
 * Serialize a FilterExpression to JSON
 */
export function serializeFilter(filter: FilterExpression): string {
  return JSON.stringify(filter);
}

/**
 * Deserialize a JSON string to a FilterExpression
 */
export function deserializeFilter(json: string): FilterExpression {
  return JSON.parse(json) as FilterExpression;
}

export function toSqlWhereClause(filter: FilterExpression): string {
  if (filter.type === "condition") {
    const conditionExpr = filter as ConditionExpression;
    const { field, operator, value } = conditionExpr;

    // Handle property and score subtypes
    if (field.subtype === "property" && field.key) {
      return `properties->>'${field.key}' ${mapOperator(
        operator
      )} ${formatValue(value)}`;
    } else if (field.subtype === "score" && field.key) {
      return `scores->>'${field.key}' ${mapOperator(operator)} ${formatValue(
        value
      )}`;
    }

    // Regular column
    return `${field.column} ${mapOperator(operator)} ${formatValue(value)}`;
  } else if (filter.type === "and") {
    const andExpr = filter as AndExpression;
    if (andExpr.expressions.length === 0) return "TRUE";
    return `(${andExpr.expressions.map(toSqlWhereClause).join(" AND ")})`;
  } else if (filter.type === "or") {
    const orExpr = filter as OrExpression;
    if (orExpr.expressions.length === 0) return "TRUE";
    return `(${orExpr.expressions.map(toSqlWhereClause).join(" OR ")})`;
  }
  return "";
}

function mapOperator(operator: string): string {
  switch (operator) {
    case "eq":
      return "=";
    case "neq":
      return "!=";
    case "gt":
      return ">";
    case "gte":
      return ">=";
    case "lt":
      return "<";
    case "lte":
      return "<=";
    case "like":
      return "LIKE";
    case "ilike":
      return "ILIKE";
    case "is":
      return "IS";
    case "in":
      return "IN";
    default:
      return "=";
  }
}

function formatValue(value: string | number | boolean): string {
  if (typeof value === "string") {
    // Escape single quotes in string values
    const escapedValue = value.replace(/'/g, "''");
    return `'${escapedValue}'`;
  } else if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  } else {
    return value.toString();
  }
}

export function isEmptyFilter(filter: FilterExpression): boolean {
  if (filter.type === "condition") {
    const conditionExpr = filter as ConditionExpression;
    return conditionExpr.value === "" || conditionExpr.value === null;
  } else if (filter.type === "and" || filter.type === "or") {
    const groupExpr = filter as AndExpression | OrExpression;
    return (
      groupExpr.expressions.length === 0 ||
      groupExpr.expressions.every(isEmptyFilter)
    );
  }
  return true;
}

export function createDefaultFilter(): FilterExpression {
  return condition("response_id", "eq", "");
}

export function createDefaultPropertyFilter(): FilterExpression {
  return propertyCondition("user_id", "eq", "");
}

export function createDefaultScoreFilter(): FilterExpression {
  return scoreCondition("toxicity", "gte", 0.5);
}
