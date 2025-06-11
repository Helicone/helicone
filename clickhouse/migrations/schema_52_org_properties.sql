CREATE TABLE IF NOT EXISTS organization_properties
(
    organization_id UUID,
    property_key LowCardinality(String),
)
ENGINE = ReplacingMergeTree()
PARTITION BY organization_id
PRIMARY KEY (organization_id, property_key)
ORDER BY (organization_id, property_key)