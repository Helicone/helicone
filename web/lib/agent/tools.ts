// TOOLS ALLOWING THE AGENT TO INTERACT WITH HELICONE

export const universalTools = [
  {
    type: "function" as const,
    function: {
      name: "navigate",
      description: "Navigates to a specific page within the Helicone platform.",
      parameters: {
        type: "object",
        properties: {
          page: {
            type: "string",
            description: "The page to navigate to",
            enum: [
              "/dashboard",
              "/requests",
              "/sessions",
              "/properties",
              "/users",
              "/cache",
              "/rate-limit",
              "/prompts",
              "/datasets",
              "/playground",
            ],
          },
        },
        required: ["page"],
      },
    },
  },
];

export const hqlTools = [
  {
    type: "function" as const,
    function: {
      name: "hql-get-schema",
      description:
        "Gets the schema of the HQL database. This is the schema of the tables and columns that are available to query.",
      parameters: {},
    },
  },
  {
    type: "function" as const,
    function: {
      name: "hql-write-query",
      description:
        "Writes a Clickhouse query based on the provided schema. Will also ask for confirmation if the user wants to run the query.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The HQL query to execute",
          },
        },
      },
      required: ["query"],
    },
  },
  {
    type: "function" as const,
    function: {
      name: "hql-run-query",
      description:
        "Executes a query on the HQL database once we receive confirmation on the written query.",
      parameters: {},
    },
  },
];

// TOOLS ON /playground
export const playgroundTools = [
  {
    type: "function" as const,
    function: {
      name: "playground-get_messages",
      description:
        "Gets the messages in the playground with IDs for each message. Always use this before editing a message to get the ID. Returns a JSON string of the messages.",
      parameters: {},
    },
  },
  {
    type: "function" as const,
    function: {
      name: "playground-edit_message",
      description: "Inputs text to edit a certain message in the playground.",
      parameters: {
        type: "object",
        properties: {
          message_index: {
            type: "number",
            description: "The index of the message to edit",
          },
          content_array_index: {
            type: "number",
            description:
              "For messages that are content arrays, this is the index of the content array to edit",
          },
          text: {
            type: "string",
            description: "The text to edit the message with",
          },
        },
        required: ["message_index", "text"],
      },
    },
  },
];

// TOOLS ON /prompts
export const promptsTools = [
  {
    type: "function" as const,
    function: {
      name: "search-prompts",
      description: "Search for prompts by name or content",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to filter prompts",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "prompts-get",
      description:
        "Gets the information of the prompts currently viewable in the prompts page.",
      parameters: {},
    },
  },
  {
    type: "function" as const,
    function: {
      name: "prompts-select",
      description:
        "Given an ID, opens a window showing the user details of the prompt. The window contains information like versions, environments, and metadata.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The ID of the prompt to select",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "prompts-get_versions",
      description:
        "Gets the versions and accompanying metadata of a prompt given an ID.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The ID of the prompt to get versions for",
          },
        },
        required: ["id"],
      },
    },
  },
];

export const filtersTools = [
  {
    type: "function" as const,
    function: {
      name: "save-current-filter",
      description: "Save the filter which is currently set in the page.",
      parameters: {},
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get-filter-args",
      description:
        "Get the available filter definitions for the requests page. This should be called before setting any filters to understand what filters are available.",
      parameters: {},
    },
  },
  {
    type: "function" as const,
    function: {
      name: "set-filters",
      description:
        "Sets the filters currently viewable in the requests page. The filter should be a valid FilterExpression object for the request_response_rmt table.",
      parameters: {
        type: "object",
        properties: {
          filter: {
            type: "object",
            description: "The filter expression to apply",
            oneOf: [
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["all"],
                    description: "Matches all records (no filtering)",
                  },
                },
                required: ["type"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["condition"],
                    description: "Single condition expression",
                  },
                  field: {
                    type: "object",
                    properties: {
                      table: {
                        type: "string",
                        enum: [
                          "request_response_rmt",
                          "sessions_request_response_rmt",
                          "users_view",
                        ],
                        description: "The table to filter on",
                      },
                      column: {
                        type: "string",
                        description: "The column name to filter on",
                      },
                      subtype: {
                        type: "string",
                        enum: ["property", "score", "sessions", "user"],
                        description: "Optional subtype for special field types",
                      },
                      valueMode: {
                        type: "string",
                        enum: ["value", "key"],
                        description:
                          "Whether to filter on the value or key of a property/score",
                      },
                      key: {
                        type: "string",
                        description:
                          "The key name for property or score filtering",
                      },
                    },
                    required: ["table", "column"],
                    additionalProperties: false,
                  },
                  operator: {
                    type: "string",
                    enum: [
                      "eq",
                      "neq",
                      "is",
                      "gt",
                      "gte",
                      "lt",
                      "lte",
                      "like",
                      "ilike",
                      "contains",
                      "in",
                    ],
                    description: "The comparison operator",
                  },
                  value: {
                    oneOf: [
                      { type: "string" },
                      { type: "number" },
                      { type: "boolean" },
                    ],
                    description: "The value to compare against",
                  },
                },
                required: ["type", "field", "operator", "value"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["and"],
                    description: "Logical AND of multiple expressions",
                  },
                  expressions: {
                    type: "array",
                    items: {
                      $ref: "#/definitions/filterExpression",
                    },
                    description:
                      "Array of filter expressions that must all match",
                  },
                },
                required: ["type", "expressions"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["or"],
                    description: "Logical OR of multiple expressions",
                  },
                  expressions: {
                    type: "array",
                    items: {
                      $ref: "#/definitions/filterExpression",
                    },
                    description:
                      "Array of filter expressions where at least one must match",
                  },
                },
                required: ["type", "expressions"],
                additionalProperties: false,
              },
            ],
          },
        },
        required: ["filter"],
        definitions: {
          filterExpression: {
            oneOf: [
              {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["all"] },
                },
                required: ["type"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["condition"] },
                  field: { type: "object" },
                  operator: { type: "string" },
                  value: {
                    oneOf: [
                      { type: "string" },
                      { type: "number" },
                      { type: "boolean" },
                    ],
                  },
                },
                required: ["type", "field", "operator", "value"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["and", "or"] },
                  expressions: {
                    type: "array",
                    items: { $ref: "#/definitions/filterExpression" },
                  },
                },
                required: ["type", "expressions"],
                additionalProperties: false,
              },
            ],
          },
        },
      },
    },
  },
];

export const GET_FILTER_ARGS_TOOL_CONTEXT = `
      Can you give me a json of the type "FilterExpression"

      import { UserMetric } from "@/lib/api/users/UserMetric";

export type FilterSubType = "property" | "score" | "sessions" | "user";
/**
 * Represents a record/row from the request_response_rmt table
 * Contains all the fields that can be filtered on
 */
interface RequestResponseRMT {
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

export interface Views {
  users_view: UserMetric;
  session_metrics: {
    cost: number;
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_requests: number;
    created_at: string;
    latest_request_created_at: string;
  };
}

/**
 * All supported filter operator types
 */
type FilterOperator =
  // Equality
  | "eq"
  | "neq"
  | "is"
  // Comparison
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  // Text search
  // if you're using like or ilike then you have to add "%" to the value before or after depending on the prompt
  | "like"
  | "ilike"
  // use "contains" if someone says "includes"
  | "contains"
  // Array operations
  | "in";

/**
 * Mapping of operator to display label
 */
const FILTER_OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: "equals",
  neq: "not equals",
  is: "is",
  gt: "greater than",
  gte: "greater than or equals",
  lt: "less than",
  lte: "less than or equals",
  like: "contains (case sensitive)",
  ilike: "contains (case insensitive)",
  contains: "contains",
  in: "in",
};

/**
 * Filter expression type union
 * Represents all possible filter expression types in the AST
 */
type FilterExpression =
  | AllExpression
  | ConditionExpression
  | AndExpression
  | OrExpression;

/**
 * Base interface for all expression types
 * Contains common properties that all expressions must have
 */
interface BaseExpression {
  type: string;
}

/**
 * Matches all records (no filtering)
 */
interface AllExpression extends BaseExpression {
  type: "all";
}

/**
 * Type for the field specification in a condition
 * Describes what field is being filtered and how
 */
interface BaseFieldSpec {
  subtype?: FilterSubType;
  valueMode?: "value" | "key";
  key?: string;
}

type FieldSpec =
  | (BaseFieldSpec & {
      table: "request_response_rmt";
      column: keyof RequestResponseRMT;
    })
  | (BaseFieldSpec & {
      table: "sessions_request_response_rmt";
      column: keyof Views["session_metrics"];
    })
  | (BaseFieldSpec & {
      table: "users_view";
      column: keyof Views["users_view"];
    });

/**
 * Single condition expression that compares a field against a value
 */
interface ConditionExpression extends BaseExpression {
  type: "condition";
  field: FieldSpec;
  operator: FilterOperator;
  value: string | number | boolean;
}

/**
 * Logical AND of multiple expressions
 * All contained expressions must match for this to match
 */
interface AndExpression extends BaseExpression {
  type: "and";
  expressions: FilterExpression[];
}

/**
 * Logical OR of multiple expressions
 * At least one contained expression must match for this to match
 */
interface OrExpression extends BaseExpression {
  type: "or";
  expressions: FilterExpression[];
}

/**
 * Creates an "all" expression that matches everything
 *
 * @example
 * const matchAll = Filter.all();
 *
 * @returns An AllExpression
 */
function all(): AllExpression {
  return { type: "all" };
}

/**
 * Creates a condition expression that filters a column with an operator and value
 *
 * @example
 * const statusFilter = Filter.condition("status", "eq", 200);
 * const modelFilter = Filter.condition("model", "like", "gpt-4%");
 *
 * @param column - Column name from request_response_rmt
 * @param operator - Comparison operator
 * @param value - Value to compare against
 * @returns A ConditionExpression
 */
function condition(
  column: string,
  operator: FilterOperator,
  value: string | number | boolean,
): ConditionExpression {
  return {
    type: "condition",
    field: {
      table: "request_response_rmt",
      column: column as keyof RequestResponseRMT,
    },
    operator,
    value,
  };
}

/**
 * Creates an AND expression combining multiple expressions
 * All expressions must match for the AND to match
 *
 * @example
 * const combinedFilter = Filter.and(
 *   Filter.condition("status", "eq", 200),
 *   Filter.condition("model", "like", "gpt-4%")
 * );
 *
 * @param expressions - Filter expressions to combine with AND
 * @returns An AndExpression
 */
function and(...expressions: FilterExpression[]): AndExpression {
  return {
    type: "and",
    expressions,
  };
}

/**
 * Creates an OR expression combining multiple expressions
 * At least one expression must match for the OR to match
 *
 * @example
 * const eitherFilter = Filter.or(
 *   Filter.condition("status", "eq", 200),
 *   Filter.condition("status", "eq", 201)
 * );
 *
 * @param expressions - Filter expressions to combine with OR
 * @returns An OrExpression
 */
function or(...expressions: FilterExpression[]): OrExpression {
  return {
    type: "or",
    expressions,
  };
}

/**
 * Creates a property condition that filters on a specific property key's value
 *
 * @example
 * const userTypeFilter = Filter.propertyCondition("user_type", "eq", "admin");
 *
 * @param key - Property key to filter on
 * @param operator - Comparison operator
 * @param value - Value to compare against
 * @returns A ConditionExpression for a property
 */
function propertyCondition(
  key: string,
  operator: FilterOperator,
  value: string | number | boolean,
): ConditionExpression {
  return {
    type: "condition",
    field: {
      table: "request_response_rmt",
      column: "properties",
      subtype: "property",
      valueMode: "value",
      key,
    },
    operator,
    value,
  };
}

/**
 * Creates a condition to filter on property key names
 *
 * @example
 * const hasUserTypeFilter = Filter.propertyKeyCondition("like", "user_");
 *
 * @param operator - Comparison operator
 * @param value - Value to compare against
 * @returns A ConditionExpression for a property key
 */
function propertyKeyCondition(
  operator: FilterOperator,
  value: string,
): ConditionExpression {
  return {
    type: "condition",
    field: {
      table: "request_response_rmt",
      column: "properties",
      subtype: "property",
      valueMode: "key",
    },
    operator,
    value,
  };
}

/**
 * Creates a score condition that filters on a specific score key's value
 *
 * @example
 * const qualityFilter = Filter.scoreCondition("quality", "gt", 0.8);
 *
 * @param key - Score key to filter on
 * @param operator - Comparison operator
 * @param value - Value to compare against
 * @returns A ConditionExpression for a score
 */
function scoreCondition(
  key: string,
  operator: FilterOperator,
  value: string | number | boolean,
): ConditionExpression {
  return {
    type: "condition",
    field: {
      table: "request_response_rmt",
      column: "scores",
      subtype: "score",
      valueMode: "value",
      key,
    },
    operator,
    value,
  };
}

/**
 * Creates a condition to filter on score key names
 *
 * @example
 * const hasQualityFilter = Filter.scoreKeyCondition("like", "quality");
 *
 * @param operator - Comparison operator
 * @param value - Value to compare against
 * @returns A ConditionExpression for a score key
 */
function scoreKeyCondition(
  operator: FilterOperator,
  value: string,
): ConditionExpression {
  return {
    type: "condition",
    field: {
      table: "request_response_rmt",
      column: "scores",
      subtype: "score",
      valueMode: "key",
    },
    operator,
    value,
  };
}

/**
 * Serializes a FilterExpression to a JSON string
 *
 * @example
 * const filterStr = Filter.serializeFilter(myFilter);
 * localStorage.setItem('savedFilter', filterStr);
 *
 * @param filter - The filter expression to serialize
 * @returns JSON string representation
 */
function serializeFilter(filter: FilterExpression): string {
  return JSON.stringify(filter);
}

/**
 * Deserializes a JSON string back into a FilterExpression
 *
 * @example
 * const savedFilter = localStorage.getItem('savedFilter');
 * if (savedFilter) {
 *   const filter = Filter.deserializeFilter(savedFilter);
 * }
 *
 * @param json - JSON string to deserialize
 * @returns The parsed FilterExpression
 */
function deserializeFilter(json: string): FilterExpression {
  return JSON.parse(json) as FilterExpression;
}

/**
 * Checks if a filter is effectively empty (matches all)
 *
 * @example
 * if (Filter.isEmptyFilter(filter)) {
 *   // No filtering applied, show all records
 * }
 *
 * @param filter - The filter to check
 * @returns True if the filter is empty/matches all
 */
function isEmptyFilter(filter: FilterExpression): boolean {
  if (filter.type === "all") {
    return true;
  }

  if (filter.type === "and" || filter.type === "or") {
    const compoundFilter = filter as AndExpression | OrExpression;

    // Empty compound expressions are effectively "all"
    if (compoundFilter.expressions.length === 0) {
      return true;
    }

    // For AND, if any child is "all", it can be removed
    // If all children are empty, the whole thing is empty
    if (filter.type === "and") {
      return compoundFilter.expressions.every(isEmptyFilter);
    }

    // For OR, if any child is "all", the whole thing is "all"
    if (filter.type === "or") {
      return compoundFilter.expressions.some(isEmptyFilter);
    }
  }

  return false;
}

/**
 * Simplifies a filter by removing redundancies
 *
 * @example
 * const optimizedFilter = Filter.simplifyFilter(complexFilter);
 *
 * @param filter - The filter to simplify
 * @returns A simplified version of the filter
 */
function simplifyFilter(filter: FilterExpression): FilterExpression {
  // Base case: single conditions or "all" can't be simplified
  if (filter.type === "all" || filter.type === "condition") {
    return filter;
  }

  if (filter.type === "and" || filter.type === "or") {
    const compoundFilter = filter as AndExpression | OrExpression;

    // Simplify all child expressions first
    const simplifiedExpressions = compoundFilter.expressions
      .map(simplifyFilter)
      .filter((expr) => {
        // Remove redundant expressions
        if (filter.type === "and" && expr.type === "all") {
          return false; // "all" in AND is redundant
        }
        return true;
      });

    // If we have no expressions left, return "all"
    if (simplifiedExpressions.length === 0) {
      return all();
    }

    // If we have only one expression left, return it directly
    if (simplifiedExpressions.length === 1) {
      return simplifiedExpressions[0];
    }

    // Otherwise return the simplified compound expression
    return {
      type: filter.type,
      expressions: simplifiedExpressions,
    } as AndExpression | OrExpression;
  }

  // Default fallback (shouldn't reach here with valid inputs)
  return filter;
}

/**
 * Creates a default empty filter that matches all records
 */
function createDefaultFilter(): FilterExpression {
  return all();
}

/**
 * Creates a default property filter template
 */
function createDefaultPropertyFilter(): FilterExpression {
  return propertyCondition("", "eq", "");
}

/**
 * Creates a default score filter template
 */
function createDefaultScoreFilter(): FilterExpression {
  return scoreCondition("", "gt", 0);
}

/**
 * Combines multiple filters with AND
 *
 * @param filters - Array of filters to combine
 * @returns A combined filter
 */
function combineFilters(filters: FilterExpression[]): FilterExpression {
  // Filter out empty filters
  const nonEmptyFilters = filters.filter((f) => !isEmptyFilter(f));

  if (nonEmptyFilters.length === 0) {
    return all();
  }

  if (nonEmptyFilters.length === 1) {
    return nonEmptyFilters[0];
  }

  return and(...nonEmptyFilters);
}

/**
 * Validates if a filter expression is well-formed
 *
 * @param filter - The filter to validate
 * @returns True if the filter is valid
 */
function validateFilter(filter: FilterExpression): boolean {
  // Basic structural validation
  if (!filter || typeof filter !== "object") {
    return false;
  }

  // Validate by type
  switch (filter.type) {
    case "all":
      return true;

    case "condition": {
      const condition = filter as ConditionExpression;
      return (
        condition.field &&
        typeof condition.field === "object" &&
        typeof condition.field.column === "string" &&
        condition.operator &&
        typeof condition.operator === "string" &&
        condition.value !== undefined
      );
    }

    case "and":
    case "or": {
      const compound = filter as AndExpression | OrExpression;
      return (
        Array.isArray(compound.expressions) &&
        compound.expressions.every(validateFilter)
      );
    }

    default:
      return false;
  }
}

/**
 * The main Filter module that provides a comprehensive filtering API
 * for building filter expressions to query the request_response_rmt table.
 *
 * @example
 * import { Filter } from "./filterAst";
 *
 * // Create a combined filter
 * const myFilter = Filter.and(
 *   Filter.where("status", "eq", 200),
 *   Filter.or(
 *     Filter.where("model", "like", "gpt-3"),
 *     Filter.where("model", "like", "gpt-4")
 *   ),
 *   Filter.property("user_type", "eq", "admin")
 * );
 *
 * // Convert to JSON for storage
 * const filterJson = Filter.serializeFilter(myFilter);
 */
export const FilterAST = {
  /** Match all records */
  all,
  /** Filter on a regular column */
  condition,
  /** Combine expressions with AND */
  and,
  /** Combine expressions with OR */
  or,
  /** Alias for condition */
  where: condition,
  /** Filter on a property value */
  property: propertyCondition,
  /** Filter on a property key */
  propertyKey: propertyKeyCondition,
  /** Filter on a score value */
  score: scoreCondition,
  /** Filter on a score key */
  scoreKey: scoreKeyCondition,
  /** Serialize filter to JSON string */
  serializeFilter,
  /** Deserialize JSON string to filter */
  deserializeFilter,
  /** Check if a filter is empty (matches all) */
  isEmptyFilter,
  /** Simplify a filter expression */
  simplifyFilter,
  /** Create a default empty filter */
  createDefaultFilter,
  /** Create a default property filter template */
  createDefaultPropertyFilter,
  /** Create a default score filter template */
  createDefaultScoreFilter,
  /** Combine multiple filters with AND */
  combineFilters,
  /** Validate a filter expression */
  validateFilter,

  /**
   * Create a NOT condition (implemented as valueIsNot === value)
   */
  not: (expr: FilterExpression): AndExpression => {
    // Implementation depends on the backend query transformer
    // This is a placeholder for the concept
    if (expr.type === "condition") {
      const condExpr = expr as ConditionExpression;
      const negatedOp: Record<FilterOperator, FilterOperator> = {
        eq: "neq",
        neq: "eq",
        is: "neq",
        gt: "lte",
        gte: "lt",
        lt: "gte",
        lte: "gt",
        like: "neq", // Simplified
        ilike: "neq", // Simplified
        contains: "neq", // Simplified
        in: "neq", // Simplified
      };

      return and(
        condition(
          condExpr.field.column,
          negatedOp[condExpr.operator] || "neq",
          condExpr.value,
        ),
      );
    }
    // For complex expressions, we'd need De Morgan's laws
    // This is just a simple placeholder
    return and(all());
  },

  // Export types
  types: {
    FILTER_OPERATOR_LABELS,
  },
};

// Type exports
export type {
  RequestResponseRMT,
  FilterOperator,
  FilterExpression,
  AllExpression,
  FieldSpec,
  ConditionExpression,
  AndExpression,
  OrExpression,
};

export const DEFAULT_FILTER_EXPRESSION = FilterAST.condition(
  "status",
  "eq",
  "200",
);

export const DEFAULT_FILTER_GROUP_EXPRESSION = FilterAST.and(
  FilterAST.condition("status", "eq", "200"),
);

export const EMPTY_FILTER_GROUP_EXPRESSION = null;
`;
