CREATE TABLE IF NOT EXISTS default.cache_hits
(
   `organization_id` UUID,
   `created_at` DateTime64 DEFAULT now(),
   `request_id` UUID
)
ENGINE = MergeTree
PRIMARY KEY (organization_id)
ORDER BY (organization_id, created_at, request_id);