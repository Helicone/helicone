ALTER TABLE request_response_rmt
ADD COLUMN IF NOT EXISTS cache_reference_id UUID
AFTER completion_audio_tokens,
    ADD COLUMN IF NOT EXISTS cache_enabled Bool DEFAULT false
AFTER country_code;