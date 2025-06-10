ALTER TABLE request_response_rmt
ADD COLUMN cost Nullable(UInt64) DEFAULT 0 AFTER response_body; 