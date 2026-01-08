-- Add free_limit_exceeded column to organization table
-- This flag indicates when a free tier org has exceeded their 10k request/30-day limit
-- When true, request/response bodies will not be stored to S3

ALTER TABLE organization
ADD COLUMN IF NOT EXISTS free_limit_exceeded BOOLEAN DEFAULT FALSE;
