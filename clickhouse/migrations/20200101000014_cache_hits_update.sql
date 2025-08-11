ALTER TABLE default.cache_hits
ADD COLUMN IF NOT EXISTS latency Nullable(Int64);