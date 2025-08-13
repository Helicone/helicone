ALTER TABLE request_response_rmt
ADD COLUMN IF NOT EXISTS prompt_audio_tokens Int64 DEFAULT 0
AFTER prompt_cache_read_tokens,
    ADD COLUMN IF NOT EXISTS completion_audio_tokens Int64 DEFAULT 0
AFTER completion_tokens; 