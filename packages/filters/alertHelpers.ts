import { 
  FilterNode, 
  FilterLeaf
} from "./filterDefs";
import { 
  AggregationNode,
  AggregationFunction,
  ComparisonOperator,
  AGGREGATION_FIELDS_MAP,
  AGGREGATION_FUNCTIONS_MAP,
  COMPARISON_OPERATORS_MAP
} from "./aggregationDefs";

/**
 * Extract field name from FilterLeaf
 */
function extractFieldFromLeaf(field: FilterLeaf): string | null {
  const tables = Object.keys(field);
  if (tables.length === 0) return null;
  
  const table = field[tables[0] as keyof FilterLeaf];
  if (!table) return null;
  
  const fields = Object.keys(table);
  if (fields.length === 0) return null;
  
  return fields[0];
}

/**
 * Check if a FilterNode is an AggregationNode
 */
function isAggregationNode(node: FilterNode): node is AggregationNode {
  return typeof node === "object" && "type" in node && node.type === "aggregation";
}

/**
 * Parse an alert filter to extract aggregation details
 */
export function parseAlertFilter(
  filter: FilterNode | string | null,
  metric?: string
): {
  type: "aggregation" | "legacy" | "unknown";
  displayName: string;
  field?: string;
  function?: string;
  comparison?: string;
  threshold?: number;
  hasWhereClause?: boolean;
} {
  // Handle legacy alerts (no filter or old metric types)
  if (!filter && metric) {
    if (metric === "response.status") {
      return {
        type: "legacy",
        displayName: "Error Rate",
        field: "status",
      };
    } else if (metric === "cost") {
      return {
        type: "legacy",
        displayName: "Total Cost",
        field: "cost",
      };
    }
  }

  // Parse string filter if needed
  let filterNode: FilterNode | null = null;
  if (typeof filter === "string") {
    try {
      filterNode = JSON.parse(filter);
    } catch {
      return {
        type: "unknown",
        displayName: "Custom Filter",
      };
    }
  } else {
    filterNode = filter;
  }

  if (!filterNode) {
    return {
      type: "unknown",
      displayName: "Unknown",
    };
  }

  // Check if it's an aggregation node
  if (isAggregationNode(filterNode)) {
    const fieldName = extractFieldFromLeaf(filterNode.field);
    const functionName = filterNode.function;
    const comparison = filterNode.comparison;
    const threshold = filterNode.threshold;

    return {
      type: "aggregation",
      displayName: formatAggregationDisplay(filterNode),
      field: fieldName || undefined,
      function: functionName,
      comparison,
      threshold,
      hasWhereClause: !!filterNode.where,
    };
  }

  return {
    type: "unknown",
    displayName: "Custom Filter",
  };
}

/**
 * Format an aggregation node for display
 */
export function formatAggregationDisplay(node: AggregationNode): string {
  const fieldName = extractFieldFromLeaf(node.field);
  const fieldInfo = fieldName ? AGGREGATION_FIELDS_MAP[fieldName] : null;
  const funcDef = AGGREGATION_FUNCTIONS_MAP[node.function as AggregationFunction];
  const functionName = funcDef?.displayName || node.function.toUpperCase();
  const opDef = COMPARISON_OPERATORS_MAP[node.comparison as ComparisonOperator];
  const comparisonSymbol = opDef?.symbol || node.comparison;
  
  const fieldDisplay = fieldInfo ? fieldInfo.displayName : (fieldName || "field");
  const unit = fieldInfo?.unit || "";
  
  // Format like: "P95(Latency) > 1000ms"
  const baseDisplay = `${functionName}(${fieldDisplay}) ${comparisonSymbol} ${node.threshold}${unit}`;
  
  return baseDisplay;
}

/**
 * Format alert threshold with proper units
 */
export function formatAlertThreshold(
  filter: FilterNode | string | null,
  metric?: string,
  threshold?: number
): string {
  const parsed = parseAlertFilter(filter, metric);
  
  // Handle legacy metrics
  if (parsed.type === "legacy") {
    if (metric === "response.status" && threshold !== undefined) {
      return `${threshold}%`;
    } else if (metric === "cost" && threshold !== undefined) {
      return `$${threshold.toFixed(2)}`;
    }
  }
  
  // Handle aggregation metrics
  if (parsed.type === "aggregation" && parsed.field && parsed.threshold !== undefined) {
    const fieldInfo = AGGREGATION_FIELDS_MAP[parsed.field];
    const unit = fieldInfo?.unit || "";
    
    if (unit === "$") {
      return `$${parsed.threshold.toFixed(2)}`;
    } else if (unit) {
      return `${parsed.threshold}${unit}`;
    } else {
      return `${parsed.threshold}`;
    }
  }
  
  // Fallback to raw threshold
  return threshold !== undefined ? threshold.toString() : "-";
}

/**
 * Get a simple metric display name for the metric column
 */
export function getAlertMetricDisplay(
  filter: FilterNode | string | null,
  metric?: string
): string {
  const parsed = parseAlertFilter(filter, metric);
  
  if (parsed.type === "aggregation" && parsed.function && parsed.field) {
    const funcDef = AGGREGATION_FUNCTIONS_MAP[parsed.function as AggregationFunction];
    const functionName = funcDef?.displayName || parsed.function.toUpperCase();
    const fieldInfo = AGGREGATION_FIELDS_MAP[parsed.field];
    const fieldDisplay = fieldInfo ? fieldInfo.displayName : parsed.field;
    
    // Short format for table: "P95 Latency"
    return `${functionName} ${fieldDisplay}`;
  }
  
  // Legacy format
  if (metric === "response.status") return "Error Rate";
  if (metric === "cost") return "Total Cost";
  
  return "Custom";
}