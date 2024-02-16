
CREATE TABLE IF NOT EXISTS default.properties_copy_v2
(
   `id` Int64,
   `created_at` DateTime64,
   `request_id` UUID,
   `key` String,
   `value` String,
   `organization_id` UUID,
)
ENGINE = MergeTree
PRIMARY KEY (id)
ORDER BY (id, organization_id, key, created_at);
