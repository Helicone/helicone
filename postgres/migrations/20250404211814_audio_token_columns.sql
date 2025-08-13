-- Add new columns for usage tracking of audio tokens
ALTER TABLE IF EXISTS public.response
    ADD COLUMN prompt_audio_tokens integer,
    ADD COLUMN completion_audio_tokens integer; 