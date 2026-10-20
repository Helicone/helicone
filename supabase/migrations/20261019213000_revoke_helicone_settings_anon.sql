-- Restrict public.helicone_settings to server-side roles.
--
-- The table holds internal configuration and is only read server-side.
-- Remove the default anon/authenticated grants and keep RLS enabled so the
-- public API key can never read or modify it.

REVOKE ALL ON TABLE public.helicone_settings FROM anon, authenticated, PUBLIC;

ALTER TABLE public.helicone_settings ENABLE ROW LEVEL SECURITY;
