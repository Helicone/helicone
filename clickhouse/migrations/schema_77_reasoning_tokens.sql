ALTER TABLE request_response_rmt
ADD COLUMN reasoning_tokens Nullable(Int64) DEFAULT 0;
