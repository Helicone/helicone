CREATE TABLE IF NOT EXISTS org_properties (
    `property` String,
    `organization_id` UUID
) ENGINE = ReplacingMergeTree
ORDER BY (organization_id, property);