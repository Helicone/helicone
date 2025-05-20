CREATE TABLE cache_metrics
(
  organization_id UUID,
  date Date,
  hour UInt8,
  request_id UUID,
  model String,
  provider String,
  cache_hit_count UInt32,
  
  -- SAVING METRICS
  saved_latency_ms UInt32,
  saved_completion_tokens UInt32,
  saved_prompt_tokens UInt32,
  saved_completion_audio_tokens UInt32,
  saved_prompt_audio_tokens UInt32,
  saved_prompt_cache_write_tokens UInt32,
  saved_prompt_cache_read_tokens UInt32,

  last_hit DateTime64(3),
  first_hit DateTime64(3),

  request_body String DEFAULT '',
  response_body String DEFAULT ''
)
ENGINE = AggregatingMergeTree()
ORDER BY (organization_id, date, hour, request_id)
