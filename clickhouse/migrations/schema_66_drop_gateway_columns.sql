ALTER TABLE request_response_rmt
DROP COLUMN IF EXISTS gateway_deployment_target;

ALTER TABLE request_response_rmt
DROP COLUMN IF EXISTS gateway_router_id;