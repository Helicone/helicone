ALTER TABLE request
ADD COLUMN user_request_id TEXT;
CREATE INDEX idx_user_request_id ON request (user_request_id);