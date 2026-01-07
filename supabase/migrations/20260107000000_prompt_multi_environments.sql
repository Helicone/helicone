-- Migration: Change environment from TEXT to TEXT[] to support multiple environments per prompt version

-- Drop the unique constraint that enforces single environment per prompt version
DROP INDEX IF EXISTS idx_prompts_2025_versions_environment;

-- Add new environments column as TEXT array
ALTER TABLE prompts_2025_versions
ADD COLUMN environments TEXT[] DEFAULT NULL;

-- Migrate existing data: convert single environment to array
UPDATE prompts_2025_versions
SET environments = ARRAY[environment]
WHERE environment IS NOT NULL;

-- Keep old environment column for backwards compatibility (deprecated, not used by new code)

-- Create index for efficient array containment queries (e.g., finding all versions with 'production')
CREATE INDEX idx_prompts_2025_versions_environments ON prompts_2025_versions USING GIN (environments)
WHERE environments IS NOT NULL AND soft_delete = false;
