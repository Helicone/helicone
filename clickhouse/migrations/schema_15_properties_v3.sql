
CREATE TABLE IF NOT EXISTS default.properties_v3
(
    `organization_id` UUID,
    `key` String,
    `value` String,
    `created_at` DateTime64,
    `id` Int64,
    `request_id` UUID,
)
ENGINE = MergeTree
PRIMARY KEY (organization_id, key, value, created_at, request_id)
ORDER BY (organization_id, key, value, created_at, request_id);
