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
    table: Tables;
    column: Columns;
  };
  operator: string;
  value: any;
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
  table: Tables,
  column: Columns,
  operator: string,
  value: any
): ConditionExpression {
  return {
    type: "condition",
    field: {
      table,
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

  return condition(
    tableName as Tables,
    columnName as Columns,
    operatorName,
    value
  );
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
    const { table, column } = condition.field;

    // Create a nested structure: { table: { column: { operator: value } } }
    const operatorObj: Record<string, any> = {};
    operatorObj[condition.operator] = condition.value;

    const columnObj: Record<string, any> = {};
    columnObj[column] = operatorObj;

    const tableObj: Record<string, any> = {};
    tableObj[table] = columnObj;

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
