-- CREATE MATERIALIZED VIEW cache_metrics_mv
-- ENGINE = SummingMergeTree()
-- PARTITION BY toYYYYMM(date)
-- ORDER BY (date, hour, cache_reference_id)
-- AS
-- SELECT
--     toDate(request_created_at) AS date,
--     toHour(request_created_at) AS hour,
--     cache_hits.cache_reference_id,
--     count() AS cache_hit_count,
--
--     max(orig.completion_tokens) AS original_completion_tokens,
--     max(orig.prompt_tokens) AS original_prompt_tokens,
--     count() * max(orig.completion_tokens) AS saved_completion_tokens,
--     count() * max(orig.prompt_tokens) AS saved_prompt_tokens,
--     count() * max(orig.completion_audio_tokens) AS saved_completion_audio_tokens,
--     count() * max(orig.prompt_audio_tokens) AS saved_prompt_audio_tokens,
--     count() * max(orig.prompt_cache_write_tokens) AS saved_prompt_cache_write_tokens,
--     count() * max(orig.prompt_cache_read_tokens) AS saved_prompt_cache_read_tokens,
--     count() * max(orig.latency) AS saved_latency_ms
-- FROM request_response_rmt cache_hits
-- INNER JOIN request_response_rmt orig ON cache_hits.cache_reference_id = orig.request_id
-- WHERE cache_hits.cache_reference_id != '00000000-0000-0000-0000-000000000000'
-- GROUP BY date, hour, cache_reference_id;

CREATE TABLE cache_metrics
(
  organization_id UUID,
  date Date,
  hour UInt8,
  request_id UUID,
  cache_hit_count UInt32,
  time_saved UInt32
)
ENGINE = AggregatingMergeTree()
ORDER BY (organization_id, date, hour, request_id) -- main problem is this might be too granular
