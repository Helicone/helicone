-- Add free_limit_exceeded column to track which month the free tier limit was exceeded
-- Stores month in YYYY-MM format (e.g., "2026-01" = exceeded in January 2026)
-- NULL = not exceeded or under limit
-- When set, request/response bodies are not stored for non-PTB requests

ALTER TABLE organization
ADD COLUMN IF NOT EXISTS free_limit_exceeded TEXT DEFAULT NULL;
