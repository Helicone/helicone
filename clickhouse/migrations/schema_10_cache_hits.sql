CREATE TABLE IF NOT EXISTS default.cache_hits
(
   `request_id` UUID,
   `organization_id` UUID,
   `created_at` DateTime64 DEFAULT now(),
)
ENGINE = MergeTree
PRIMARY KEY (request_id)
ORDER BY (request_id, created_at);

--    `cache_key` Nullable(String), 