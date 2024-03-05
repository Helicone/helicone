ALTER TABLE property_with_response_v1
ADD COLUMN IF NOT EXISTS threat Nullable(Bool)
AFTER organization_id;