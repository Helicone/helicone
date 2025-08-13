CREATE TABLE IF NOT EXISTS default.rate_limit_log (
    `organization_id` UUID,
    `created_at` DateTime DEFAULT now(),
) ENGINE = MergeTree PRIMARY KEY (organization_id, created_at)
ORDER BY (
        organization_id,
        created_at
    );