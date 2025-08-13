CREATE TABLE IF NOT EXISTS default.response_copy_v1
(
   `response_id` Nullable(UUID),
   `response_created_at` Nullable(DateTime64),
   `latency` Nullable(Int64),
   `status` Nullable(Int64),
   `completion_tokens` Nullable(Int64),
   `prompt_tokens` Nullable(Int64),
   `model` Nullable(String),
   `request_id` UUID,
   `request_created_at` DateTime64,
   `auth_hash` String,
   user_id Nullable(String),
)
ENGINE = MergeTree
PRIMARY KEY (request_id)
ORDER BY (request_id, request_created_at);
