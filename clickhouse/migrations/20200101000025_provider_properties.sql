ALTER TABLE property_with_response_v1
ADD COLUMN IF NOT EXISTS provider Nullable(String)
AFTER time_to_first_token;