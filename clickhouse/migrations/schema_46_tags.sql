CREATE TABLE IF NOT EXISTS default.tags (
    organization_id UUID,
    entity_type String,
    entity_id String,
    tag String,
    created_at DateTime DEFAULT now(),
    PRIMARY KEY (organization_id, entity_type)
) ENGINE = ReplacingMergeTree()
ORDER BY (organization_id, entity_type, entity_id, tag);

-- https://clickhouse.com/docs/guides/developer/deduplication