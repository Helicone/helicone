ALTER TABLE request_response_log
DROP COLUMN IF EXISTS request_ip;

ALTER TABLE request_response_log
ADD COLUMN IF NOT EXISTS country_code Nullable(String)
AFTER target_url;