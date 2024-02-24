ALTER TABLE response_copy_v3
ADD COLUMN threat Nullable(Bool)
AFTER organization_id