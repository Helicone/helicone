-- Add metadata column to prompts_versions table
ALTER TABLE "public"."prompts_versions"
ADD COLUMN metadata JSONB;

-- Create an index on the metadata column for better query performance
CREATE INDEX idx_prompts_versions_metadata ON prompts_versions USING GIN (metadata);