ALTER TABLE default.cache_hits
ADD COLUMN IF NOT EXISTS prompt_tokens Nullable(Int64);