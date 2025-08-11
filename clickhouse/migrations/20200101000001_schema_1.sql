
CREATE TABLE IF NOT EXISTS default.properties_copy_v1
(
   `id` Int64,
   `created_at` DateTime64,
   `user_id` Nullable(UUID),
   `request_id` UUID,
   `auth_hash` String,
   `key` Nullable(String),
   `value` Nullable(String),
)
ENGINE = MergeTree
PRIMARY KEY (id)
ORDER BY (id, created_at);