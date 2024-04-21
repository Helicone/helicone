CREATE TABLE IF NOT EXISTS default.request_response_versioned (
    `response_id` Nullable(UUID),
    `response_created_at` Nullable(DateTime64),
    `latency` Nullable(Int64),
    `status` Int64,
    `completion_tokens` Nullable(Int64),
    `prompt_tokens` Nullable(Int64),
    `model` String,
    `request_id` UUID,
    `request_created_at` DateTime64,
    `user_id` String,
    `organization_id` UUID,
    `proxy_key_id` Nullable(UUID),
    `threat` Nullable(Bool),
    `time_to_first_token` Nullable(Int64),
    `provider` String,
    `target_url` Nullable(String),
    `country_code` Nullable(String),
    `created_at` DateTime DEFAULT now(),
    `sign` Int8,
    `version` UInt32, 
    `properties` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    `scores` Map(LowCardinality(String), Int64) CODEC(ZSTD(1)),
    INDEX idx_properties_key mapKeys(properties) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_properties_value mapValues(properties) TYPE bloom_filter(0.01) GRANULARITY 1
) ENGINE = VersionedCollapsingMergeTree(sign, version)
PRIMARY KEY (
    organization_id,
    provider,
    model,
    request_created_at,
    request_id
)
ORDER BY (
    organization_id,
    provider,
    model,
    request_created_at,
    request_id
)