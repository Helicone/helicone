ALTER TABLE request_response_log
ADD COLUMN IF NOT EXISTS request_ip Nullable(String)
AFTER target_url;