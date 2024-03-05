ALTER TABLE default.cache_hits
ADD COLUMN IF NOT EXISTS model String;