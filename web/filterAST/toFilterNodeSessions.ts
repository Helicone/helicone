// Converter from FilterAST to legacy FilterNode for session metrics

import {
  FilterNode,
  FilterBranch,
  FilterLeaf,
} from "@/services/lib/filters/filterDefs";
import {
  FilterExpression,
  ConditionExpression,
  AndExpression,
  OrExpression,
} from "./filterAst";

/**
 * Maps the new FilterAST operator names to the legacy operator names
 */
const operatorMap: Record<string, string> = {
  eq: "equals",
  neq: "not-equals",
  gt: "gt",
  gte: "gte",
  lt: "lt",
  lte: "lte",
  like: "like",
  ilike: "ilike",
  contains: "contains",
};

/**
 * Get field type based on field name for sessions_request_response_rmt
 * This helps with proper type conversion for values
 */
function getFieldType(fieldName: string): "string" | "number" {
  const numberFields = [
    "total_tokens",
    "total_requests",
    "total_completion_tokens",
    "total_prompt_token",
    "cost",
  ];

  if (numberFields.includes(fieldName)) {
    return "number";
  } else {
    return "string";
  }
}

/**
 * Process value based on field type
 */
function processValue(
  fieldName: string,
  value: string | number | boolean
): string | number | boolean {
  const fieldType = getFieldType(fieldName);

  if (fieldType === "number" && typeof value === "string") {
    return parseFloat(value);
  }

  return value;
}

/**
 * Converts a new FilterExpression to the legacy FilterNode format specifically for sessions
 *
 * @param filter - The new filter expression to convert
 * @returns The equivalent legacy filter node
 */
export function toFilterNodeSessions(filter: FilterExpression): FilterNode {
  // Handle "all" expression
  if (filter.type === "all") {
    return "all";
  }

  // Handle condition expression
  if (filter.type === "condition") {
    const condition = filter as ConditionExpression;
    const operator = operatorMap[condition.operator] || condition.operator;

    // Only process sessions table conditions
    if (condition.field.table === "sessions_request_response_rmt") {
      const fieldName = condition.field.column.toString();
      const processedValue = processValue(fieldName, condition.value);

      // Create filter leaf for sessions
      const result: FilterLeaf = {
        sessions_request_response_rmt: {
          [fieldName]: {
            [operator]: processedValue,
          },
        },
      };

      return result;
    }

    // For non-sessions tables, return "all" as fallback
    return "all";
  }

  // Handle AND expression
  if (filter.type === "and") {
    const andExpr = filter as AndExpression;

    // If there are no expressions, return "all"
    if (andExpr.expressions.length === 0) {
      return "all";
    }

    // If there's only one expression, convert it directly
    if (andExpr.expressions.length === 1) {
      return toFilterNodeSessions(andExpr.expressions[0]);
    }

    // Convert the first expression
    const left = toFilterNodeSessions(andExpr.expressions[0]);

    // Convert the rest of the expressions as a nested AND
    const right = toFilterNodeSessions({
      type: "and",
      expressions: andExpr.expressions.slice(1),
    });

    // Create the branch
    const result: FilterBranch = {
      left,
      operator: "and",
      right,
    };

    return result;
  }

  // Handle OR expression
  if (filter.type === "or") {
    const orExpr = filter as OrExpression;

    // If there are no expressions, return "all"
    if (orExpr.expressions.length === 0) {
      return "all";
    }

    // If there's only one expression, convert it directly
    if (orExpr.expressions.length === 1) {
      return toFilterNodeSessions(orExpr.expressions[0]);
    }

    // Convert the first expression
    const left = toFilterNodeSessions(orExpr.expressions[0]);

    // Convert the rest of the expressions as a nested OR
    const right = toFilterNodeSessions({
      type: "or",
      expressions: orExpr.expressions.slice(1),
    });

    // Create the branch
    const result: FilterBranch = {
      left,
      operator: "or",
      right,
    };

    return result;
  }

  throw new Error("Unknown filter type: " + filter);
}
