CREATE TABLE IF NOT EXISTS organization_ptb_spend
(
    organization_id UUID,
    spend UInt64,
)
ENGINE = ReplacingMergeTree()
PRIMARY KEY (organization_id)
ORDER BY (organization_id)