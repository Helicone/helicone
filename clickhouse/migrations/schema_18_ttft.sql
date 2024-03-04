ALTER TABLE request_response_log
ADD COLUMN IF NOT EXISTS time_to_first_token Nullable(Int64)
AFTER threat