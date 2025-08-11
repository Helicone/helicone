ALTER TABLE response_copy_v3
ADD COLUMN IF NOT EXISTS threat Nullable(Bool)
AFTER organization_id;