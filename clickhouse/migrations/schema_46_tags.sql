CREATE TABLE IF NOT EXISTS default.tags (
    entity_type String,
    entity_id String,
    tag String,
    created_at DateTime DEFAULT now(),
    PRIMARY KEY (entity_type, entity_id, tag)
) ENGINE = ReplacingMergeTree()
ORDER BY (entity_type, entity_id, tag);

-- https://clickhouse.com/docs/guides/developer/deduplication