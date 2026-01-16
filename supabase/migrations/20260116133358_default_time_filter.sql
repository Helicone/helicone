-- Add default_time_filter column to organization table
-- This allows organizations to configure their default time filter for dashboard and requests pages
-- Default is '7d' (7 days)

ALTER TABLE organization ADD COLUMN IF NOT EXISTS default_time_filter TEXT DEFAULT '7d';
