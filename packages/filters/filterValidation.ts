import { FilterLeaf, FilterNode, TablesAndViews } from "./filterDefs";

/**
 * Thrown when a filter supplied by a caller references a table, column or
 * operator that the filter builder does not know about, or is otherwise
 * malformed. Callers should treat this as a client error (400).
 */
export class FilterValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FilterValidationError";
    // Keep `instanceof` working when compiled to ES5.
    Object.setPrototypeOf(this, FilterValidationError.prototype);
  }
}

export function hasOwn(obj: unknown, key: PropertyKey): boolean {
  return (
    typeof obj === "object" &&
    obj !== null &&
    Object.prototype.hasOwnProperty.call(obj, key)
  );
}

/**
 * Operators a caller may put in a filter. Internal operators produced by key
 * mappers ("has", "gin-contains", "vector-contains") are deliberately absent:
 * they are never accepted from input.
 */
export const USER_FILTER_OPERATORS = [
  "equals",
  "not-equals",
  "like",
  "ilike",
  "gte",
  "gt",
  "lte",
  "lt",
  "contains",
  "not-contains",
] as const;
export type UserFilterOperator = (typeof USER_FILTER_OPERATORS)[number];

const USER_FILTER_OPERATOR_SET: ReadonlySet<string> = new Set(
  USER_FILTER_OPERATORS
);

export function isUserFilterOperator(op: unknown): op is UserFilterOperator {
  return typeof op === "string" && USER_FILTER_OPERATOR_SET.has(op);
}

/**
 * "scalar": `{ column: { <operator>: value } }`
 * "map":    `{ column: { <any key>: { <operator>: value } } }` (e.g. properties)
 */
type ColumnKind = "scalar" | "map";

type ColumnsOf<T> = { [C in keyof Required<T>]: ColumnKind };

type FilterSchema = {
  [T in keyof TablesAndViews]: string extends keyof TablesAndViews[T]
    ? "map"
    : ColumnsOf<TablesAndViews[T]>;
};

/**
 * Runtime mirror of the FilterLeaf types in filterDefs.ts. The mapped type
 * makes the compiler fail if a table or column is added to filterDefs.ts but
 * not here (or vice versa).
 */
const FILTER_SCHEMA: FilterSchema = {
  user_metrics: {
    user_id: "scalar",
    last_active: "scalar",
    total_requests: "scalar",
    active_for: "scalar",
    average_requests_per_day_active: "scalar",
    average_tokens_per_request: "scalar",
    total_completion_tokens: "scalar",
    total_prompt_tokens: "scalar",
    cost: "scalar",
  },
  user_api_keys: {
    api_key_hash: "scalar",
    api_key_name: "scalar",
  },
  response: {
    body_tokens: "scalar",
    body_model: "scalar",
    body_completion: "scalar",
    status: "scalar",
    model: "scalar",
  },
  request: {
    prompt: "scalar",
    created_at: "scalar",
    user_id: "scalar",
    auth_hash: "scalar",
    org_id: "scalar",
    id: "scalar",
    node_id: "scalar",
    model: "scalar",
    modelOverride: "scalar",
    path: "scalar",
    country_code: "scalar",
    prompt_id: "scalar",
  },
  feedback: {
    id: "scalar",
    created_at: "scalar",
    rating: "scalar",
    response_id: "scalar",
  },
  properties_table: {
    auth_hash: "scalar",
    key: "scalar",
    value: "scalar",
  },
  prompt_v2: {
    id: "scalar",
    user_defined_id: "scalar",
  },
  prompts_versions: {
    minor_version: "scalar",
    major_version: "scalar",
    id: "scalar",
    prompt_v2: "scalar",
  },
  experiment: {
    id: "scalar",
    prompt_v2: "scalar",
  },
  experiment_hypothesis_run: {
    result_request_id: "scalar",
  },
  score_value: {
    request_id: "scalar",
  },
  request_response_log: {
    latency: "scalar",
    status: "scalar",
    request_created_at: "scalar",
    response_created_at: "scalar",
    auth_hash: "scalar",
    model: "scalar",
    user_id: "scalar",
    organization_id: "scalar",
    node_id: "scalar",
    job_id: "scalar",
    threat: "scalar",
  },
  request_response_rmt: {
    country_code: "scalar",
    latency: "scalar",
    cost: "scalar",
    provider: "scalar",
    time_to_first_token: "scalar",
    status: "scalar",
    request_created_at: "scalar",
    response_created_at: "scalar",
    model: "scalar",
    user_id: "scalar",
    organization_id: "scalar",
    node_id: "scalar",
    job_id: "scalar",
    threat: "scalar",
    request_id: "scalar",
    prompt_tokens: "scalar",
    completion_tokens: "scalar",
    prompt_cache_read_tokens: "scalar",
    prompt_cache_write_tokens: "scalar",
    total_tokens: "scalar",
    target_url: "scalar",
    property_key: "scalar",
    properties: "map",
    search_properties: "map",
    scores: "map",
    scores_column: "scalar",
    request_body: "scalar",
    response_body: "scalar",
    cache_enabled: "scalar",
    cache_reference_id: "scalar",
    cached: "scalar",
    assets: "scalar",
    "helicone-score-feedback": "scalar",
    prompt_id: "scalar",
    prompt_version: "scalar",
    request_referrer: "scalar",
    is_passthrough_billing: "scalar",
  },
  sessions_request_response_rmt: {
    session_session_id: "scalar",
    session_session_name: "scalar",
    session_total_cost: "scalar",
    session_total_tokens: "scalar",
    session_prompt_tokens: "scalar",
    session_completion_tokens: "scalar",
    session_total_requests: "scalar",
    session_created_at: "scalar",
    session_latest_request_created_at: "scalar",
    session_tag: "scalar",
  },
  users_view: {
    user_user_id: "scalar",
    user_active_for: "scalar",
    user_first_active: "scalar",
    user_last_active: "scalar",
    user_total_requests: "scalar",
    user_average_requests_per_day_active: "scalar",
    user_average_tokens_per_request: "scalar",
    user_total_completion_tokens: "scalar",
    user_total_prompt_tokens: "scalar",
    user_cost: "scalar",
  },
  properties_v3: {
    key: "scalar",
    value: "scalar",
    organization_id: "scalar",
  },
  property_with_response_v1: {
    property_key: "scalar",
    property_value: "scalar",
    request_created_at: "scalar",
    organization_id: "scalar",
    threat: "scalar",
  },
  job: {
    id: "scalar",
    name: "scalar",
    description: "scalar",
    status: "scalar",
    created_at: "scalar",
    updated_at: "scalar",
    timeout_seconds: "scalar",
    custom_properties: "map",
    org_id: "scalar",
  },
  job_node: {
    id: "scalar",
    name: "scalar",
    description: "scalar",
    job_id: "scalar",
    status: "scalar",
    created_at: "scalar",
    updated_at: "scalar",
    timeout_seconds: "scalar",
    custom_properties: "map",
    org_id: "scalar",
  },
  cache_metrics: {
    organization_id: "scalar",
    request_id: "scalar",
    date: "scalar",
    hour: "scalar",
    model: "scalar",
    cache_hit_count: "scalar",
    saved_latency_ms: "scalar",
    saved_completion_tokens: "scalar",
    saved_prompt_tokens: "scalar",
    saved_completion_audio_tokens: "scalar",
    saved_prompt_audio_tokens: "scalar",
    saved_prompt_cache_write_tokens: "scalar",
    saved_prompt_cache_read_tokens: "scalar",
    first_hit: "scalar",
    last_hit: "scalar",
    request_body: "scalar",
    response_body: "scalar",
  },
  rate_limit_log: {
    organization_id: "scalar",
    created_at: "scalar",
  },
  organization_properties: {
    organization_id: "scalar",
    property_key: "scalar",
  },
  properties: "map",
  values: "map",
};

/**
 * Columns the FilterAST UI (filterExpressions.ts FieldSpec -> toFilterNode)
 * can emit that are not in the FilterLeaf types. They have no SQL mapping and
 * have always been ignored by the builder; they are accepted (and still
 * ignored) so existing UI filters keep working.
 */
const LEGACY_IGNORED_COLUMNS: Partial<
  Record<keyof TablesAndViews, readonly string[]>
> = {
  request_response_rmt: ["response_id", "proxy_key_id", "updated_at"],
  sessions_request_response_rmt: [
    "cost",
    "total_tokens",
    "prompt_tokens",
    "completion_tokens",
    "total_requests",
    "created_at",
    "latest_request_created_at",
  ],
  users_view: [
    "cost",
    "user_id",
    "total_requests",
    "active_for",
    "first_active",
    "last_active",
    "average_requests_per_day_active",
    "average_tokens_per_request",
    "total_completion_tokens",
    "total_prompt_tokens",
  ],
};

export const MAX_FILTER_DEPTH = 1000;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function describeKey(key: string): string {
  // Keep error messages short and free of arbitrary user input.
  return /^[A-Za-z0-9_\-.]{1,64}$/.test(key) ? `"${key}"` : "<invalid key>";
}

function getColumnKind(
  table: keyof TablesAndViews,
  column: string
): ColumnKind | "ignored" | undefined {
  const tableSchema = FILTER_SCHEMA[table];
  if (tableSchema === "map") {
    return "scalar";
  }
  if (hasOwn(tableSchema, column)) {
    return (tableSchema as Record<string, ColumnKind>)[column];
  }
  const legacy = LEGACY_IGNORED_COLUMNS[table];
  if (legacy && legacy.indexOf(column) !== -1) {
    return "ignored";
  }
  return undefined;
}

function isAllowedFilterValue(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value instanceof Date
  );
}

/**
 * Validates `{ <operator>: value, ... }` and returns one single-operator
 * object per operator.
 */
function splitOperatorObject(
  operatorObject: unknown,
  path: string
): Record<string, unknown>[] {
  if (!isPlainObject(operatorObject)) {
    throw new FilterValidationError(`Invalid filter: ${path} must be an object`);
  }
  const operators = Object.keys(operatorObject);
  if (operators.length === 0) {
    throw new FilterValidationError(
      `Invalid filter: ${path} must specify an operator`
    );
  }
  return operators.map((operator) => {
    if (!isUserFilterOperator(operator)) {
      throw new FilterValidationError(
        `Invalid filter: unknown operator ${describeKey(operator)} at ${path}`
      );
    }
    const value = operatorObject[operator];
    if (!isAllowedFilterValue(value)) {
      throw new FilterValidationError(
        `Invalid filter: unsupported value for ${path}.${operator}`
      );
    }
    return { [operator]: value };
  });
}

export interface FilterLeafAtom {
  table: keyof TablesAndViews;
  /** Exactly one column with exactly one operator (map columns: one key). */
  tableFilter: Record<string, unknown>;
}

/**
 * Validates a FilterLeaf against the schema and splits it into atoms, each of
 * which holds exactly one table / column / (map key) / operator. Every atom is
 * ANDed by the builder, so no predicate in the leaf is silently dropped.
 *
 * Throws FilterValidationError for unknown tables, columns or operators.
 */
export function splitFilterLeaf(leaf: unknown): FilterLeafAtom[] {
  if (!isPlainObject(leaf)) {
    throw new FilterValidationError("Invalid filter: leaf must be an object");
  }
  const atoms: FilterLeafAtom[] = [];

  for (const tableKey of Object.keys(leaf)) {
    if (!hasOwn(FILTER_SCHEMA, tableKey)) {
      throw new FilterValidationError(
        `Invalid filter: unknown table ${describeKey(tableKey)}`
      );
    }
    const table = tableKey as keyof TablesAndViews;
    const tableValue = leaf[tableKey];
    if (!isPlainObject(tableValue)) {
      throw new FilterValidationError(
        `Invalid filter: ${describeKey(tableKey)} must be an object`
      );
    }

    for (const column of Object.keys(tableValue)) {
      const kind = getColumnKind(table, column);
      const path = `${describeKey(tableKey)}.${describeKey(column)}`;
      if (kind === undefined) {
        throw new FilterValidationError(
          `Invalid filter: unknown column ${describeKey(column)} for table ${describeKey(tableKey)}`
        );
      }
      const columnValue = tableValue[column];

      if (kind === "map") {
        if (!isPlainObject(columnValue)) {
          throw new FilterValidationError(
            `Invalid filter: ${path} must be an object`
          );
        }
        for (const mapKey of Object.keys(columnValue)) {
          for (const op of splitOperatorObject(columnValue[mapKey], path)) {
            atoms.push({ table, tableFilter: { [column]: { [mapKey]: op } } });
          }
        }
        continue;
      }

      const ops = splitOperatorObject(columnValue, path);
      if (kind === "ignored") {
        // Validated, but there is no SQL mapping for this column.
        continue;
      }
      for (const op of ops) {
        atoms.push({ table, tableFilter: { [column]: op } });
      }
    }
  }

  return atoms;
}

/**
 * Validates an entire FilterNode tree. Throws FilterValidationError on any
 * unknown key, table, column or operator, or on a malformed branch.
 */
export function validateFilterNode(node: unknown): asserts node is FilterNode {
  const stack: { node: unknown; depth: number }[] = [{ node, depth: 0 }];

  while (stack.length > 0) {
    const { node: current, depth } = stack.pop()!;
    if (depth > MAX_FILTER_DEPTH) {
      throw new FilterValidationError("Invalid filter: nesting too deep");
    }
    if (current === "all") {
      continue;
    }
    if (!isPlainObject(current)) {
      throw new FilterValidationError("Invalid filter: node must be an object");
    }

    if (isFilterBranchShape(current)) {
      const keys = Object.keys(current);
      if (
        keys.length !== 3 ||
        !hasOwn(current, "left") ||
        !hasOwn(current, "right") ||
        !hasOwn(current, "operator")
      ) {
        throw new FilterValidationError(
          "Invalid filter: branch must have exactly left, operator and right"
        );
      }
      if (current.operator !== "and" && current.operator !== "or") {
        throw new FilterValidationError(
          'Invalid filter: branch operator must be "and" or "or"'
        );
      }
      stack.push({ node: current.left, depth: depth + 1 });
      stack.push({ node: current.right, depth: depth + 1 });
      continue;
    }

    splitFilterLeaf(current as FilterLeaf);
  }
}

export function isFilterBranchShape(node: object): boolean {
  return hasOwn(node, "left") || hasOwn(node, "right") || hasOwn(node, "operator");
}
