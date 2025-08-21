// Runtime logic for aggregation filters (parallel to filters.ts)

import { 
  AggregationFunction,
  ComparisonOperator,
  AggregationNode,
  AGGREGATION_FUNCTIONS_MAP
} from "./aggregationDefs";
import { FilterLeaf, AllOperators } from "./filterDefs";
import { operatorToSql } from "./filters";

// Re-export these types for convenience
export type { AggregationFunction, ComparisonOperator, AggregationNode };

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

// Key mappings - these should match what's in filters.ts
// TODO: Consider exporting these from filters.ts instead of duplicating
type KeyMappings = any; // Simplified for now, should import proper type

/**
 * Extract field name from FilterLeaf for aggregation purposes
 */
export function extractFieldFromFilterLeaf(
  leaf: FilterLeaf,
  keyMappings: KeyMappings
): string {
  const table = Object.keys(leaf)[0] as keyof FilterLeaf;
  const fieldObj = leaf[table];

  if (!fieldObj || typeof fieldObj !== "object") {
    return "";
  }

  // Get the field name (e.g., "latency", "cost", etc.)
  const field = Object.keys(fieldObj)[0];

  // Special handling for properties and scores
  if (field === "properties" || field === "scores") {
    const subFieldObj = (fieldObj as any)[field];
    const subField = Object.keys(subFieldObj || {})[0];
    return field === "properties"
      ? `properties['${subField}']`
      : `scores['${subField}']`;
  }

  // Use key mappings to get the actual column name
  const mapper = keyMappings[table];
  if (mapper && typeof mapper === "function") {
    const tableObj = { [table]: fieldObj };
    const { column } = mapper(tableObj as any, (v: any) => v);
    return column || field;
  }

  return field;
}

/**
 * Build aggregation filter for SQL generation
 */
export function buildAggregationFilter(args: {
  filter: AggregationNode;
  argPlaceHolder: (index: number, value: any) => string;
  argsAcc: any[];
  having: boolean;
  keyMappings: KeyMappings;
}): {
  filter: string;
  argsAcc: any[];
} {
  const { filter, argPlaceHolder, argsAcc, keyMappings } = args;

  // Extract the field from the FilterLeaf
  const fieldName = extractFieldFromFilterLeaf(filter.field, keyMappings);

  // Build aggregation SQL
  const aggFunc = buildAggregationFunction(filter.function, fieldName);

  // Build comparison
  const comparison = operatorToSql(filter.comparison as AllOperators);

  // Add threshold parameter
  const newArgsAcc = [...argsAcc];
  newArgsAcc.push(filter.threshold);
  const thresholdParam = argPlaceHolder(
    newArgsAcc.length - 1,
    filter.threshold
  );

  return {
    filter: `${aggFunc} ${comparison} ${thresholdParam}`,
    argsAcc: newArgsAcc,
  };
}