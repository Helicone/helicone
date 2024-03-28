ALTER TABLE cache_hits
ADD COLUMN IF NOT EXISTS country_code Nullable(String)
AFTER provider;