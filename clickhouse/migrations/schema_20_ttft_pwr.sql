ALTER TABLE property_with_response_v1
ADD COLUMN IF NOT EXISTS time_to_first_token Nullable(Int64)
AFTER organization_id;