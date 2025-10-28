ALTER TABLE request_response_rmt
ADD COLUMN ai_gateway_body_mapping String DEFAULT '' AFTER model;
