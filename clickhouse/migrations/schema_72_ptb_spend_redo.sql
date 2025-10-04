-- see docs: https://clickhouse.com/docs/materialized-view/incremental-materialized-view

DROP TABLE IF EXISTS organization_ptb_spend;


CREATE TABLE IF NOT EXISTS organization_ptb_spend
(
    organization_id UUID,
    spend UInt64
)
ENGINE = SummingMergeTree
PRIMARY KEY (organization_id)
ORDER BY (organization_id);



CREATE MATERIALIZED VIEW IF NOT EXISTS organization_ptb_spend_mv
TO organization_ptb_spend AS
SELECT
    organization_id,
    sum(cost) as spend -- UInt64, can hold up to ~18 billion in cost per organization
FROM default.request_response_rmt
WHERE is_passthrough_billing = true
GROUP BY organization_id;

INSERT INTO organization_ptb_spend (
    organization_id,
    spend
)
SELECT
    organization_id,
    sum(cost) as spend
FROM request_response_rmt
WHERE is_passthrough_billing = true
AND request_created_at <= now()
AND request_created_at >= now() - INTERVAL 30 DAY
GROUP BY organization_id;