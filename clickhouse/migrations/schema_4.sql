CREATE TABLE IF NOT EXISTS default.feedback_copy
(
   `id` Int64,
   `uuid` UUID,
   `created_at` DateTime64,
   `response_id` UUID,
   `boolean_value` Nullable(Boolean),
   `float_value` Nullable(Float64),
   `string_value` Nullable(String),
   `categorical_value` Nullable(String),
   `created_by` String,
   `completion_tokens` Nullable(Int64),
   `prompt_tokens` Nullable(Int64),
   `model` Nullable(String),
   `organization_id` UUID,
   `metric_name` String,
   `metric_data_type` String
)
ENGINE = MergeTree
PRIMARY KEY (id)
ORDER BY (id, organization_id, response_id, created_at);