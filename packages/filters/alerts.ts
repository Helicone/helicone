// Unified types for advanced querying on Alerts

export const ALERT_METRICS = [
  "response.status",
  "cost",
  "latency",
  "total_tokens",
  "prompt_tokens",
  "completion_tokens",
  "prompt_cache_read_tokens",
  "prompt_cache_write_tokens",
  "count",
] as const;

export type AlertMetric = (typeof ALERT_METRICS)[number];

export const ALERT_AGGREGATIONS = [
  "sum",
  "avg",
  "min",
  "max",
  "percentile",
] as const;

export type AlertAggregation = (typeof ALERT_AGGREGATIONS)[number];

export const ALERT_STANDARD_GROUPINGS = [
  "user",
  "model",
  "provider",
] as const;

export type AlertStandardGrouping = (typeof ALERT_STANDARD_GROUPINGS)[number];
export type AlertGrouping = AlertStandardGrouping | string; // string for custom properties