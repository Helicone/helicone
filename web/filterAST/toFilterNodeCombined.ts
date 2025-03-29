// Combined converter from FilterAST to legacy FilterNode for both regular and user view filters

import { FilterNode } from "@/services/lib/filters/filterDefs";
import {
  FilterExpression,
  ConditionExpression,
  AndExpression,
  OrExpression,
} from "./filterAst";
import { toFilterNode } from "./toFilterNode";
import { toFilterNodeUserMetrics } from "./toFilterNodeUserView";
import { toFilterNodeSessions } from "./toFilterNodeSessions";

/**
 * Combines converters for different tables into a single function.
 * This delegates to the appropriate converter based on the filter content.
 *
 * Priority:
 * 1. If the filter only contains user_metrics table conditions, use toFilterNodeUserView
 * 2. If the filter only contains sessions_request_response_rmt table conditions, use toFilterNodeSessions
 * 3. Otherwise, use the regular toFilterNode
 *
 * @param filter - The new filter expression to convert
 * @returns The equivalent legacy filter node
 */
export function toFilterNodeCombined(filter: FilterExpression): FilterNode {
  // Special case for "all" filters
  if (filter.type === "all") {
    return "all";
  }

  // Check if this is a pure user_metrics filter
  if (isPureUserViewFilter(filter)) {
    return toFilterNodeUserMetrics(filter);
  }

  // Check if this is a pure sessions filter
  if (isPureSessionsFilter(filter)) {
    return toFilterNodeSessions(filter);
  }

  // For everything else, use the standard converter
  return toFilterNode(filter);
}

/**
 * Checks if a filter expression only contains conditions for the user_metrics table
 */
function isPureUserViewFilter(filter: FilterExpression): boolean {
  // Handle leaf condition
  if (filter.type === "condition") {
    const condition = filter as ConditionExpression;
    return condition.field.table === "user_metrics";
  }

  // Handle AND expressions
  if (filter.type === "and") {
    const andExpr = filter as AndExpression;
    // Empty AND is not a pure user view filter
    if (andExpr.expressions.length === 0) {
      return false;
    }
    // All subexpressions must be pure user view filters
    return andExpr.expressions.every(isPureUserViewFilter);
  }

  // Handle OR expressions
  if (filter.type === "or") {
    const orExpr = filter as OrExpression;
    // Empty OR is not a pure user view filter
    if (orExpr.expressions.length === 0) {
      return false;
    }
    // All subexpressions must be pure user view filters
    return orExpr.expressions.every(isPureUserViewFilter);
  }

  return false;
}

/**
 * Checks if a filter expression only contains conditions for the sessions_request_response_rmt table
 */
function isPureSessionsFilter(filter: FilterExpression): boolean {
  // Handle leaf condition
  if (filter.type === "condition") {
    const condition = filter as ConditionExpression;
    return condition.field.table === "sessions_request_response_rmt";
  }

  // Handle AND expressions
  if (filter.type === "and") {
    const andExpr = filter as AndExpression;
    // Empty AND is not a pure sessions filter
    if (andExpr.expressions.length === 0) {
      return false;
    }
    // All subexpressions must be pure sessions filters
    return andExpr.expressions.every(isPureSessionsFilter);
  }

  // Handle OR expressions
  if (filter.type === "or") {
    const orExpr = filter as OrExpression;
    // Empty OR is not a pure sessions filter
    if (orExpr.expressions.length === 0) {
      return false;
    }
    // All subexpressions must be pure sessions filters
    return orExpr.expressions.every(isPureSessionsFilter);
  }

  return false;
}
