ALTER TABLE request_response_versioned
ADD COLUMN IF NOT EXISTS request_tag Nullable(UUID)
AFTER request_id;