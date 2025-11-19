-- Drop the old decrypted_provider_keys view
-- This view has been replaced by decrypted_provider_keys_v2
-- All application code now uses the v2 view

DROP VIEW IF EXISTS public.decrypted_provider_keys;
