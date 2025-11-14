ALTER TABLE request_response_rmt
ADD COLUMN storage_location LowCardinality(String) DEFAULT 's3';
