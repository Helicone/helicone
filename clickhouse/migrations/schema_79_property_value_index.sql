-- Add bloom filter index on property values for faster filtering
ALTER TABLE request_response_rmt
ADD INDEX idx_properties_value mapValues(properties) TYPE bloom_filter(0.01) GRANULARITY 1;

-- Materialize the index for existing data
ALTER TABLE request_response_rmt MATERIALIZE INDEX idx_properties_value;
