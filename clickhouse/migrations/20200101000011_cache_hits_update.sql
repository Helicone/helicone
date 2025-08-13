ALTER TABLE default.cache_hits
ADD COLUMN IF NOT EXISTS completion_tokens Nullable(Int64);