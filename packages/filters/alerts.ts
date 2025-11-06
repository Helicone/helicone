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
];

export type AlertMetric = (typeof ALERT_METRICS)[number];