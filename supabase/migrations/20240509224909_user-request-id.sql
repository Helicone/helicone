ALTER TABLE request
ADD COLUMN request_tag UUID;
CREATE INDEX idx_request_tag ON request (request_tag);