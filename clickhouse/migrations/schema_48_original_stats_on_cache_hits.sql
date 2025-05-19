ALTER TABLE request_response_rmt
ADD COLUMN IF NOT EXISTS ref_latency Int64 DEFAULT 0
AFTER latency,
    ADD COLUMN IF NOT EXISTS ref_completion_tokens Int64 DEFAULT 0
AFTER completion_tokens,
    ADD COLUMN IF NOT EXISTS ref_completion_audio_tokens Int64 DEFAULT 0
AFTER completion_audio_tokens,
    ADD COLUMN IF NOT EXISTS ref_prompt_tokens Int64 DEFAULT 0
AFTER prompt_tokens,
    ADD COLUMN IF NOT EXISTS ref_prompt_cache_write_tokens Int64 DEFAULT 0
AFTER prompt_cache_write_tokens,
    ADD COLUMN IF NOT EXISTS ref_prompt_cache_read_tokens Int64 DEFAULT 0
AFTER prompt_cache_read_tokens,
    ADD COLUMN IF NOT EXISTS ref_prompt_audio_tokens Int64 DEFAULT 0
AFTER prompt_audio_tokens;