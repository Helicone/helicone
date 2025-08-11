UPDATE prompts_2025_versions 
SET environment = 'production'
WHERE id IN (
    SELECT production_version 
    FROM prompts_2025 
    WHERE production_version IS NOT NULL 
    AND organization = prompts_2025_versions.organization
);