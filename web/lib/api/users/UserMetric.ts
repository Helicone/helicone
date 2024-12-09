export interface UserMetric {
  id?: string;
  user_id: string;
  active_for: number;
  first_active: Date;
  last_active: Date;
  total_requests: number;
  average_requests_per_day_active: number;
  average_tokens_per_request: number;
  cost: number;
  rate_limited_count: number;
}
