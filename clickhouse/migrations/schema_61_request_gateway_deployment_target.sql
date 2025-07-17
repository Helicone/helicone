ALTER TABLE request_response_rmt
ADD COLUMN gateway_deployment_target String DEFAULT '' AFTER gateway_router_id
