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
AND request_created_at >= now() - INTERVAL 15 DAY
GROUP BY organization_id;