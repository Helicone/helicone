CREATE TABLE IF NOT EXISTS default.rate_limit_log_v2 (
    `request_id` UUID,
    `organization_id` UUID,
    `rate_limit_created_at` DateTime DEFAULT now(),
    `created_at` DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree()
ORDER BY (
        organization_id,
        rate_limit_created_at,
        request_id
    );