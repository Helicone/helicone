
-- Add unique constraint for demo organizations
ALTER TABLE organization
ADD CONSTRAINT unique_demo_org_per_user UNIQUE (owner, tier);