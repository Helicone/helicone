
CREATE TABLE IF NOT EXISTS default.property_with_response_v1
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
    `property_key` String,
    `property_value` String
)
ENGINE = MergeTree
PRIMARY KEY (organization_id, user_id, property_key, request_created_at, status, model, request_id)
ORDER BY (organization_id, user_id, property_key, request_created_at, status, model, request_id)