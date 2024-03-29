ALTER TABLE request_response_log
ADD COLUMN IF NOT EXISTS country_code Nullable(String)
AFTER request_ip;