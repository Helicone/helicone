CREATE MATERIALIZED VIEW cache_metrics_mv
REFRESH EVERY 60 MINUTE TO cache_metrics
AS
SELECT 
    organization_id,
    date,
    hour,
    request_id,
    count() AS cache_hit_count,
    sum(latency) AS saved_latency_ms,
    sum(original_completion_tokens) AS saved_completion_tokens,
    sum(original_prompt_tokens) AS saved_prompt_tokens,
    sum(original_completion_audio_tokens) AS saved_completion_audio_tokens,
    sum(original_prompt_audio_tokens) AS saved_prompt_audio_tokens,
    sum(original_prompt_cache_write_tokens) AS saved_prompt_cache_write_tokens,
    sum(original_prompt_cache_read_tokens) AS saved_prompt_cache_read_tokens
FROM (
    SELECT
        organization_id,
        toDate(request_created_at) AS date,
        toHour(request_created_at) AS hour,
        original.request_id AS request_id,
        original.latency AS latency,
        original.completion_tokens AS original_completion_tokens,
        original.prompt_tokens AS original_prompt_tokens,
        original.completion_audio_tokens AS original_completion_audio_tokens,
        original.prompt_audio_tokens AS original_prompt_audio_tokens,
        original.prompt_cache_write_tokens AS original_prompt_cache_write_tokens,
        original.prompt_cache_read_tokens AS original_prompt_cache_read_tokens
    FROM request_response_rmt LEFT JOIN request_response_rmt original ON request_response_rmt.cache_reference_id = original.request_id
    WHERE original.latency is NOT NULL 
) GROUP BY organization_id, date, hour, request_id