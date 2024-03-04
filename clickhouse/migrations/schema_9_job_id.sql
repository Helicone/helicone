ALTER TABLE response_copy_v3
ADD COLUMN IF NOT EXISTS job_id Nullable(UUID) AFTER organization_id
