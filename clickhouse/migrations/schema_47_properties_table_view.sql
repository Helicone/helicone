CREATE TABLE IF NOT EXISTS jawn_http_logs (
    organization_id UUID,
    method String,
    url String,
    status UInt16,
    duration UInt32,
    user_agent String,
    created_at DateTime64(3, 'UTC') DEFAULT now(),
    properties Map(String, String)
) ENGINE = MergeTree() PARTITION BY toYYYYMM(created_at)
ORDER BY (organization_id, created_at) TTL toDateTime(created_at) + INTERVAL 90 DAY;