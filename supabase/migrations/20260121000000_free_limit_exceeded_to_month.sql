-- Change free_limit_exceeded from BOOLEAN to TEXT (YYYY-MM format)
-- This allows tracking which month the limit was exceeded
-- NULL = not exceeded, "2026-01" = exceeded in January 2026

-- Drop the old boolean column
ALTER TABLE organization DROP COLUMN IF EXISTS free_limit_exceeded;

-- Add new text column for month tracking
ALTER TABLE organization
ADD COLUMN free_limit_exceeded TEXT DEFAULT NULL;
