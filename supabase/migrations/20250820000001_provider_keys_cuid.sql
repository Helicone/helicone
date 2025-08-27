-- uncommend and run this migration to add the cuid column to the provider_keys table (for cloud)

-- ALTER TABLE public.provider_keys
-- ADD COLUMN cuid TEXT DEFAULT NULL;

-- ALTER TABLE public.provider_keys
-- ADD CONSTRAINT provider_keys_cuid_unique UNIQUE (cuid);

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
--   -- pk.provider_key as decrypted_provider_key, -- this is only for local mock
--   pk.provider_secret_key,
--   -- pk.provider_secret_key as decrypted_provider_secret_key, -- this is only for local mock

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

--   -- -- decrypted_provider_secret_key
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
--   pk.config,
--   pk.cuid
-- FROM public.provider_keys pk;