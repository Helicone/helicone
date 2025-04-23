CREATE TABLE IF NOT EXISTS jawn_http_logs (
    organization_id UUID,
    method String,
    url String,
    status UInt16,
    duration UInt32,
    user_agent String,
    timestamp DateTime64(3, 'UTC') DEFAULT now(),
    properties JSON
) ENGINE = MergeTree() PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, timestamp) TTL timestamp + INTERVAL 90 DAY;