ALTER TABLE request_response_log
ADD COLUMN IF NOT EXISTS provider Nullable(String)
AFTER time_to_first_token;