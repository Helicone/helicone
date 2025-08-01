ALTER TABLE prompts_2025_versions
ADD COLUMN environment TEXT DEFAULT NULL;

CREATE UNIQUE INDEX idx_prompts_2025_versions_environment ON prompts_2025_versions(prompt_id, organization, environment) WHERE environment IS NOT NULL;

-- add to inputs as well
ALTER TABLE prompts_2025_inputs
ADD COLUMN environment TEXT DEFAULT NULL;