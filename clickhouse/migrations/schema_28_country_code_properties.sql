ALTER TABLE property_with_response_v1
ADD COLUMN IF NOT EXISTS country_code Nullable(String)
AFTER provider;