CREATE MATERIALIZED VIEW IF NOT EXISTS organization_ptb_spending_mv
TO organization_ptb_spending AS
SELECT
    organization_id,
    sum(cost) as spend -- UInt64, can hold up to ~18 billion in cost per organization
FROM default.request_response_rmt
WHERE is_passthrough_billing = true
GROUP BY organization_id