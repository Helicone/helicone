ALTER TABLE request_response_rmt
ADD COLUMN gateway_router_id String DEFAULT '' AFTER cache_reference_id
