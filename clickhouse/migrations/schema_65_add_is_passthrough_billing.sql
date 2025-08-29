ALTER TABLE request_response_rmt
ADD COLUMN IF NOT EXISTS is_passthrough_billing Boolean DEFAULT false AFTER request_referrer;

ALTER TABLE request_response_rmt
ADD INDEX IF NOT EXISTS idx_org_passthrough_billing (organization_id, is_passthrough_billing)
TYPE set(2)
GRANULARITY 4;