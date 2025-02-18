ALTER TABLE request_response_rmt
ADD COLUMN IF NOT EXISTS prompt_cache_write_tokens Int64 DEFAULT 0
AFTER prompt_tokens,
    ADD COLUMN IF NOT EXISTS prompt_cache_read_tokens Int64 DEFAULT 0
AFTER prompt_cache_write_tokens;