export interface ModelMetrics {
  model: string;
  provider: string;
  sum_prompt_tokens: number;
  sum_completion_tokens: number;
  sum_tokens: number;
}

export interface ModelMetricsUsers {
  model: string;
  sum_tokens: number;
  sum_prompt_tokens: number;
  sum_completion_tokens: number;
  user_id: string;
}
