ALTER TABLE request_response_versioned
ADD COLUMN IF NOT EXISTS user_request_id Nullable(String)
AFTER request_id;