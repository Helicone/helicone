CREATE MATERIALIZED VIEW cache_metrics_mv
REFRESH EVERY 60 MINUTE TO cache_metrics
AS
SELECT organization_id, date, hour, request_id, count() AS cache_hit_count, sum(latency) AS time_saved FROM (
    SELECT
        organization_id,
        toDate(request_created_at) AS date,
        toHour(request_created_at) AS hour,
        original.request_id AS request_id,
        original.latency AS latency
    FROM request_response_rmt LEFT JOIN request_response_rmt original ON request_response_rmt.cache_reference_id = original.request_id
    WHERE original.latency is NOT NULL 
) GROUP BY organization_id, date, hour, request_id