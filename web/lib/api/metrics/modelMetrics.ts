export interface ModelMetrics {
  model: string;
  provider: string;
  sum_prompt_tokens: number;
  prompt_cache_write_tokens: number;
  prompt_cache_read_tokens: number;
  prompt_audio_tokens: number;
  completion_audio_tokens: number;
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
