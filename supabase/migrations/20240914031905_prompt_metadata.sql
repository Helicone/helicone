-- Add metadata column to prompt_v2 table
ALTER TABLE "public"."prompt_v2"
ADD COLUMN metadata JSONB;
-- Create an index on the metadata column for better query performance
CREATE INDEX idx_prompt_metadata ON prompt_v2 USING GIN (metadata);