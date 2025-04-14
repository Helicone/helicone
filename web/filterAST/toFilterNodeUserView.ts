// Converter from FilterAST to legacy FilterNode for user views

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
  is: "equals", // Boolean operators use 'equals' in legacy format
};

/**
 * Get field type based on field name for user_metrics
 * This helps with proper type conversion for values
 */
function getFieldType(
  fieldName: string
): "string" | "number" | "datetime" | "boolean" {
  const numberFields = [
    "active_for",
    "total_requests",
    "average_requests_per_day_active",
    "average_tokens_per_request",
    "total_completion_tokens",
    "total_prompt_token",
    "cost",
  ];

  const dateFields = ["first_active", "last_active"];

  if (numberFields.includes(fieldName)) {
    return "number";
  } else if (dateFields.includes(fieldName)) {
    return "datetime";
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
  } else if (
    fieldType === "datetime" &&
    typeof value === "string" &&
    !value.includes("T")
  ) {
    // Convert date string to ISO format if needed
    return new Date(value).toISOString();
  }

  return value;
}

/**
 * Converts a new FilterExpression to the legacy FilterNode format specifically for user_metrics
 *
 * @param filter - The new filter expression to convert
 * @returns The equivalent legacy filter node
 */
export function toFilterNodeUserMetrics(filter: FilterExpression): FilterNode {
  // Handle "all" expression
  if (filter.type === "all") {
    return "all";
  }

  // Handle condition expression
  if (filter.type === "condition") {
    const condition = filter as ConditionExpression;
    const operator = operatorMap[condition.operator] || condition.operator;

    // Only process user_metrics table conditions
    if (condition.field.table === "user_metrics") {
      const fieldName = condition.field.column.toString();
      const processedValue = processValue(fieldName, condition.value);

      // Create filter leaf for user_metrics
      const result: FilterLeaf = {
        user_metrics: {
          [fieldName]: {
            [operator]: processedValue,
          },
        },
      };

      return result;
    }

    // For non-user_metrics tables, return "all" as fallback
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
      return toFilterNodeUserMetrics(andExpr.expressions[0]);
    }

    // Convert the first expression
    const left = toFilterNodeUserMetrics(andExpr.expressions[0]);

    // Convert the rest of the expressions as a nested AND
    const right = toFilterNodeUserMetrics({
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
      return toFilterNodeUserMetrics(orExpr.expressions[0]);
    }

    // Convert the first expression
    const left = toFilterNodeUserMetrics(orExpr.expressions[0]);

    // Convert the rest of the expressions as a nested OR
    const right = toFilterNodeUserMetrics({
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
