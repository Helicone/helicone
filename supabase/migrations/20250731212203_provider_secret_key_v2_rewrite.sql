
-- BEGIN;

-- ---------------------------------------------------------------
-- -- 1. One-time data cleanup: convert any "-"/"_" to "+"/"/"
-- ---------------------------------------------------------------
-- UPDATE public.provider_keys
-- SET
--   provider_key        = translate(provider_key,        '-_', '+/'),
--   provider_secret_key = translate(provider_secret_key, '-_', '+/')
-- WHERE
--   provider_key        LIKE '%-%' OR provider_key        LIKE '%_%'
--    OR provider_secret_key LIKE '%-%' OR provider_secret_key LIKE '%_%';

-- ------------------------------------------------------------------
-- -- 2. Recreate the view with translate() fix (no duplicate cols)
-- ------------------------------------------------------------------
-- CREATE OR REPLACE VIEW public.decrypted_provider_keys_v2 AS
-- SELECT
--   pk.id,
--   pk.org_id,
--   pk.provider_name,
--   pk.provider_key_name,
--   pk.vault_key_id,
--   pk.soft_delete,
--   pk.created_at,
--   pk.provider_key,
--   pk.provider_secret_key,

--   -- decrypted_provider_key
--   CASE
--     WHEN pk.provider_key IS NULL OR pk.key_id IS NULL THEN NULL
--     ELSE convert_from(
--            pgsodium.crypto_aead_det_decrypt(
--              decode(translate(pk.provider_key, '-_', '+/'), 'base64'),
--              convert_to(pk.org_id::text, 'utf8'),
--              pk.key_id,
--              pk.nonce),
--            'utf8')
--   END AS decrypted_provider_key,

--   -- decrypted_provider_secret_key
--   CASE
--     WHEN pk.provider_secret_key IS NULL OR pk.key_id IS NULL THEN NULL
--     ELSE convert_from(
--            pgsodium.crypto_aead_det_decrypt(
--              decode(translate(pk.provider_secret_key, '-_', '+/'), 'base64'),
--              convert_to(pk.org_id::text, 'utf8'),
--              pk.key_id,
--              pk.nonce),
--            'utf8')
--   END AS decrypted_provider_secret_key,

--   pk.key_id,
--   pk.auth_type,
--   pk.nonce,
--   pk.config
-- FROM public.provider_keys pk;

-- ------------------------------------------------------------------
-- -- 3. Permissions: only service_role can read the view
-- ------------------------------------------------------------------
-- REVOKE ALL ON public.decrypted_provider_keys_v2 FROM anon, authenticated;
-- GRANT  SELECT ON public.decrypted_provider_keys_v2 TO service_role;

-- COMMIT;
