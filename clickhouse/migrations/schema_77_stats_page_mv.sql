-- idempotency
DROP TABLE IF EXISTS request_stats_mv;
DROP TABLE IF EXISTS request_stats;

CREATE TABLE IF NOT EXISTS request_stats
(
    hour DateTime,
    model LowCardinality(String),
    provider LowCardinality(String),
    is_passthrough_billing Bool,
    
    total_prompt_tokens SimpleAggregateFunction(sum, Int64),
    total_completion_tokens SimpleAggregateFunction(sum, Int64),
    total_completion_audio_tokens SimpleAggregateFunction(sum, Int64),
    total_prompt_audio_tokens SimpleAggregateFunction(sum, Int64),
    total_prompt_cache_write_tokens SimpleAggregateFunction(sum, Int64),
    total_prompt_cache_read_tokens SimpleAggregateFunction(sum, Int64),
    
    latency_sum SimpleAggregateFunction(sum, Int64),
    ttft_sum SimpleAggregateFunction(sum, Int64),
    
    total_requests SimpleAggregateFunction(sum, UInt64),
    successful_requests SimpleAggregateFunction(sum, UInt64)
)
ENGINE = SummingMergeTree()
ORDER BY (hour, model, provider, is_passthrough_billing);


CREATE MATERIALIZED VIEW IF NOT EXISTS request_stats_mv
TO request_stats AS
SELECT
    toStartOfHour(request_created_at) AS hour,
    model,
    provider,
    is_passthrough_billing,
    
    sum(coalesce(prompt_tokens, 0)) AS total_prompt_tokens,
    sum(coalesce(completion_tokens, 0)) AS total_completion_tokens,
    sum(completion_audio_tokens) AS total_completion_audio_tokens,
    sum(prompt_audio_tokens) AS total_prompt_audio_tokens,
    sum(prompt_cache_write_tokens) AS total_prompt_cache_write_tokens,
    sum(prompt_cache_read_tokens) AS total_prompt_cache_read_tokens,
    
    sum(coalesce(latency, 0)) AS latency_sum,
    sum(coalesce(time_to_first_token, 0)) AS ttft_sum,
    
    count(*) AS total_requests,
    countIf(status >= 200 AND status <= 299) AS successful_requests
    
FROM default.request_response_rmt
WHERE request_referrer = 'ai-gateway'
GROUP BY hour, model, provider, is_passthrough_billing;


-- Backfill historical data (last 30 days)
INSERT INTO request_stats (
    hour,
    model,
    provider,
    is_passthrough_billing,
    total_prompt_tokens,
    total_completion_tokens,
    total_completion_audio_tokens,
    total_prompt_audio_tokens,
    total_prompt_cache_write_tokens,
    total_prompt_cache_read_tokens,
    latency_sum,
    ttft_sum,
    total_requests,
    successful_requests
)
SELECT
    toStartOfHour(request_created_at) AS hour,
    model,
    provider,
    is_passthrough_billing,
    
    sum(coalesce(prompt_tokens, 0)) AS total_prompt_tokens,
    sum(coalesce(completion_tokens, 0)) AS total_completion_tokens,
    sum(completion_audio_tokens) AS total_completion_audio_tokens,
    sum(prompt_audio_tokens) AS total_prompt_audio_tokens,
    sum(prompt_cache_write_tokens) AS total_prompt_cache_write_tokens,
    sum(prompt_cache_read_tokens) AS total_prompt_cache_read_tokens,
    
    sum(coalesce(latency, 0)) AS latency_sum,
    sum(coalesce(time_to_first_token, 0)) AS ttft_sum,
    
    count(*) AS total_requests,
    countIf(status >= 200 AND status <= 299) AS successful_requests
    
FROM default.request_response_rmt
WHERE request_referrer = 'ai-gateway'
  AND request_created_at >= now() - INTERVAL 30 DAY
  AND request_created_at <= now()
GROUP BY hour, model, provider, is_passthrough_billing;
