ALTER TABLE prompts_2025_versions
ADD COLUMN environment TEXT DEFAULT NULL;

CREATE UNIQUE INDEX idx_prompts_2025_versions_environment ON prompts_2025_versions(prompt_id, organization, environment) WHERE environment IS NOT NULL;

-- Migrate existing production_version refs to the new system
UPDATE prompts_2025_versions 
SET environment = 'production'
WHERE id IN (
    SELECT production_version 
    FROM prompts_2025 
    WHERE production_version IS NOT NULL 
    AND organization = prompts_2025_versions.organization
);

-- add to inputs as well
ALTER TABLE prompts_2025_inputs
ADD COLUMN environment TEXT DEFAULT NULL;