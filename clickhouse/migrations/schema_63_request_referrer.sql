ALTER TABLE request_response_rmt
ADD COLUMN request_referrer String DEFAULT '' AFTER cache_reference_id;
