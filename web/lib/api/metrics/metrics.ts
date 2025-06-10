import { FilterNode } from "@helicone-package/filters/filterDefs";

export interface Metrics {
  average_requests_per_day: number;
  average_response_time: number;
  average_tokens_per_response: number;
  total_requests: number;
  first_request: Date;
  last_request: Date;
  total_cost: number;
  total_tokens: number;
}

export interface GetMetricsOptions {
  filter: FilterNode;
}
