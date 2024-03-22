ALTER TABLE cache_hits
ADD COLUMN IF NOT EXISTS provider Nullable(String)
AFTER prompt_tokens;