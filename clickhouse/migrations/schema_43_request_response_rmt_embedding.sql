ALTER TABLE request_response_rmt
ADD COLUMN embedding Array(Float32)
AFTER request_body;