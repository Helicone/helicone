-- Add new columns for usage tracking of cache tokens
ALTER TABLE IF EXISTS public.response
    ADD COLUMN prompt_cache_write_tokens integer,
    ADD COLUMN prompt_cache_read_tokens integer;