// For legacy adapters for now lets just convert to the old filter node

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
  FieldSpec,
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
  // Add more mappings as needed
};

/**
 * Converts a field specification to the appropriate table name for the legacy filter
 */
function getTableFromField(field: FieldSpec): string {
  // Default to request_response_rmt
  const table = field.table || "request_response_rmt";

  // Handle special subtypes
  if (field.subtype === "property") {
    return "properties";
  }

  if (field.subtype === "score") {
    return "scores";
  }

  // Map tables to legacy names
  switch (table) {
    case "request_response_rmt":
      return "request_response_rmt";
    // Add more mappings as needed
    default:
      return table;
  }
}

/**
 * Converts a new FilterExpression to the legacy FilterNode format
 *
 * @param filter - The new filter expression to convert
 * @returns The equivalent legacy filter node
 */
export function toFilterNode(filter: FilterExpression): FilterNode {
  // Handle "all" expression
  if (filter.type === "all") {
    return "all";
  }

  // Handle condition expression
  if (filter.type === "condition") {
    const condition = filter as ConditionExpression;
    const table = getTableFromField(condition.field);
    const operator = operatorMap[condition.operator] || condition.operator;

    // Handle property or score with key
    if (
      (condition.field.subtype === "property" ||
        condition.field.subtype === "score") &&
      condition.field.valueMode === "value" &&
      condition.field.key
    ) {
      // Create a nested structure for properties or scores
      const result: FilterLeaf = {
        [table]: {
          [condition.field.key]: {
            [operator]: condition.value,
          },
        },
      };

      return result;
    }

    // Handle regular column condition
    const result: FilterLeaf = {
      [table]: {
        [condition.field.column]: {
          [operator]: condition.value,
        },
      },
    };

    return result;
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
      return toFilterNode(andExpr.expressions[0]);
    }

    // Convert the first expression
    const left = toFilterNode(andExpr.expressions[0]);

    // Convert the rest of the expressions as a nested AND
    const right = toFilterNode({
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
      return toFilterNode(orExpr.expressions[0]);
    }

    // Convert the first expression
    const left = toFilterNode(orExpr.expressions[0]);

    // Convert the rest of the expressions as a nested OR
    const right = toFilterNode({
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
