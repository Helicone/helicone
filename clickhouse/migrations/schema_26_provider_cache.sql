ALTER TABLE cache_hits
ADD COLUMN IF NOT EXISTS provider Nullable(String)
AFTER time_to_first_token;