// Single source of truth for all aggregation-related constants and display metadata

// Import types from filterDefs
import { AggregationFunction, ComparisonOperator } from "./filterDefs";

// ============ FIELD DEFINITIONS ============
export interface AggregationFieldDef {
  value: string;
  label: string;
  displayName: string;
  unit?: string;
}

export const AGGREGATION_FIELDS: AggregationFieldDef[] = [
  {
    value: "latency",
    label: "Latency (ms)",
    displayName: "Latency",
    unit: "ms",
  },
  { value: "cost", label: "Cost ($)", displayName: "Cost", unit: "$" },
  {
    value: "completion_tokens",
    label: "Completion Tokens",
    displayName: "Completion Tokens",
    unit: "",
  },
  {
    value: "prompt_tokens",
    label: "Prompt Tokens",
    displayName: "Prompt Tokens",
    unit: "",
  },
  {
    value: "total_tokens",
    label: "Total Tokens",
    displayName: "Total Tokens",
    unit: "",
  },
  {
    value: "time_to_first_token",
    label: "Time to First Token (ms)",
    displayName: "Time to First Token",
    unit: "ms",
  },
  {
    value: "status",
    label: "Status Code",
    displayName: "Status Code",
    unit: "",
  },
];

// Create a map for quick lookups
export const AGGREGATION_FIELDS_MAP: Record<string, AggregationFieldDef> =
  AGGREGATION_FIELDS.reduce(
    (acc, field) => {
      acc[field.value] = field;
      return acc;
    },
    {} as Record<string, AggregationFieldDef>
  );

// ============ FUNCTION DEFINITIONS ============
export interface AggregationFunctionDef {
  value: AggregationFunction;
  label: string;
  displayName: string;
  sqlTemplate: (field: string) => string;
}

export const AGGREGATION_FUNCTIONS: AggregationFunctionDef[] = [
  {
    value: "avg",
    label: "Average",
    displayName: "Average",
    sqlTemplate: (field) => `AVG(${field})`,
  },
  {
    value: "sum",
    label: "Sum",
    displayName: "Total",
    sqlTemplate: (field) => `SUM(${field})`,
  },
  {
    value: "min",
    label: "Minimum",
    displayName: "Minimum",
    sqlTemplate: (field) => `MIN(${field})`,
  },
  {
    value: "max",
    label: "Maximum",
    displayName: "Maximum",
    sqlTemplate: (field) => `MAX(${field})`,
  },
  {
    value: "count",
    label: "Count",
    displayName: "Count",
    sqlTemplate: (field) => `COUNT(${field})`,
  },
  {
    value: "p50",
    label: "P50 (Median)",
    displayName: "P50",
    sqlTemplate: (field) => `quantile(0.50)(${field})`,
  },
  {
    value: "p75",
    label: "P75",
    displayName: "P75",
    sqlTemplate: (field) => `quantile(0.75)(${field})`,
  },
  {
    value: "p90",
    label: "P90",
    displayName: "P90",
    sqlTemplate: (field) => `quantile(0.90)(${field})`,
  },
  {
    value: "p95",
    label: "P95",
    displayName: "P95",
    sqlTemplate: (field) => `quantile(0.95)(${field})`,
  },
  {
    value: "p99",
    label: "P99",
    displayName: "P99",
    sqlTemplate: (field) => `quantile(0.99)(${field})`,
  },
];

// Create a map for quick lookups
export const AGGREGATION_FUNCTIONS_MAP: Record<
  AggregationFunction,
  AggregationFunctionDef
> = AGGREGATION_FUNCTIONS.reduce(
  (acc, func) => {
    acc[func.value] = func;
    return acc;
  },
  {} as Record<AggregationFunction, AggregationFunctionDef>
);

// ============ COMPARISON OPERATOR DEFINITIONS ============
export interface ComparisonOperatorDef {
  value: ComparisonOperator;
  label: string;
  symbol: string;
}

export const COMPARISON_OPERATORS: ComparisonOperatorDef[] = [
  { value: "gt", label: "Greater than (>)", symbol: ">" },
  { value: "gte", label: "Greater than or equal (≥)", symbol: "≥" },
  { value: "lt", label: "Less than (<)", symbol: "<" },
  { value: "lte", label: "Less than or equal (≤)", symbol: "≤" },
  { value: "equals", label: "Equals (=)", symbol: "=" },
];

// Create a map for quick lookups
export const COMPARISON_OPERATORS_MAP: Record<
  ComparisonOperator,
  ComparisonOperatorDef
> = COMPARISON_OPERATORS.reduce(
  (acc, op) => {
    acc[op.value] = op;
    return acc;
  },
  {} as Record<ComparisonOperator, ComparisonOperatorDef>
);

// ============ HELPER FUNCTIONS ============

/**
 * Build SQL aggregation function string
 */
export function buildAggregationFunction(
  func: AggregationFunction,
  field: string
): string {
  const funcDef = AGGREGATION_FUNCTIONS_MAP[func];
  if (!funcDef) {
    // Fallback to AVG if function not found
    return `AVG(${field})`;
  }
  return funcDef.sqlTemplate(field);
}

/**
 * Get field display information
 */
export function getFieldDisplay(
  fieldValue: string
): AggregationFieldDef | undefined {
  return AGGREGATION_FIELDS_MAP[fieldValue];
}

/**
 * Get function display information
 */
export function getFunctionDisplay(
  funcValue: AggregationFunction
): AggregationFunctionDef | undefined {
  return AGGREGATION_FUNCTIONS_MAP[funcValue];
}

/**
 * Get operator display information
 */
export function getOperatorDisplay(
  opValue: ComparisonOperator
): ComparisonOperatorDef | undefined {
  return COMPARISON_OPERATORS_MAP[opValue];
}
