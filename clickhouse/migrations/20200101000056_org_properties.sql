CREATE TABLE IF NOT EXISTS organization_properties
(
    organization_id UUID,
    property_key String,
)
ENGINE = ReplacingMergeTree()
PRIMARY KEY (organization_id, property_key)
ORDER BY (organization_id, property_key)