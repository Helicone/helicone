ALTER TABLE response_copy_v3
ADD COLUMN IF NOT EXISTS threat Nullable(String) AFTER organization_id