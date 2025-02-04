ALTER TABLE request_response_rmt
ADD COLUMN IF NOT EXISTS prompt_cache_write_tokens Nullable(Int64) AFTER prompt_tokens,
ADD COLUMN IF NOT EXISTS prompt_cache_read_tokens Nullable(Int64) AFTER prompt_cache_write_tokens;