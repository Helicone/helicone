CREATE TABLE cache_metrics
(
  organization_id UUID,
  date Date,
  hour UInt8,
  request_id UUID,
  model String,
  provider String,
  cache_hit_count AggregateFunction(count, UInt64),
  
  -- SAVING METRICS
  saved_latency_ms SimpleAggregateFunction(sum, UInt64),
  saved_completion_tokens SimpleAggregateFunction(sum, UInt64),
  saved_prompt_tokens SimpleAggregateFunction(sum, UInt64),
  saved_completion_audio_tokens SimpleAggregateFunction(sum, UInt64),
  saved_prompt_audio_tokens SimpleAggregateFunction(sum, UInt64),
  saved_prompt_cache_write_tokens SimpleAggregateFunction(sum, UInt64),
  saved_prompt_cache_read_tokens SimpleAggregateFunction(sum, UInt64),

  last_hit SimpleAggregateFunction(max, DateTime64(3)),
  first_hit SimpleAggregateFunction(min, DateTime64(3)),

  request_body String DEFAULT '',
  response_body String DEFAULT ''
)
ENGINE = AggregatingMergeTree()
ORDER BY (organization_id, date, hour, request_id)
