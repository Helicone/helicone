CREATE TABLE IF NOT EXISTS default.feedback
(
   `response_id` Nullable(UUID),
   `response_created_at` Nullable(DateTime64),
   `latency` Nullable(Int64),
   `status` Int64,
   `completion_tokens` Nullable(Int64),
   `prompt_tokens` Nullable(Int64),
   `model` String,
   `request_id` UUID,
   `request_created_at` DateTime64,
   `auth_hash` String,
   `user_id` String,
   `organization_id` UUID,
   `created_at` DateTime64,
   `feedback_id` UInt64,
   `is_thumbs_up` Bool
)
ENGINE = MergeTree
PRIMARY KEY (organization, user, request_created_at, status, model)
ORDER BY (organization, user, request_created_at, status, model);