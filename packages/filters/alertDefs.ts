// String literal union type (following filter definitions pattern)
export type AlertMetricType = "response.status" | "cost" | "aggregation";

// Interface for metric definition
export interface AlertMetricDefinition {
  id: AlertMetricType;
  label: string;
  requiresThreshold: boolean;
  thresholdValidation?: {
    min?: number;
    max?: number;
  };
}

// Static definitions array (like STATIC_FILTER_DEFINITIONS)
export const ALERT_METRIC_DEFINITIONS: AlertMetricDefinition[] = [
  {
    id: "response.status",
    label: "Error Rate", 
    requiresThreshold: true,
    thresholdValidation: { min: 1, max: 100 }
  },
  {
    id: "cost",
    label: "Cost",
    requiresThreshold: true,
    thresholdValidation: { min: 0.01 }
  },
  {
    id: "aggregation",
    label: "Custom Aggregation",
    requiresThreshold: false, // Uses aggregation config threshold
  },
];