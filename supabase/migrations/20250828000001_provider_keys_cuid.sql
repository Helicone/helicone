-- Conditional migration for provider_keys cuid column
-- Checks if pgsodium is available and applies appropriate migration

DO $$
DECLARE
    has_pgsodium boolean := false;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pgsodium'
    ) INTO has_pgsodium;

    ALTER TABLE public.provider_keys
    ADD COLUMN IF NOT EXISTS cuid TEXT DEFAULT NULL;

    ALTER TABLE public.provider_keys
    ADD CONSTRAINT provider_keys_cuid_unique UNIQUE (cuid);

    -- Create view based on pgsodium availability
    IF has_pgsodium THEN
        -- Production view with pgsodium encryption
        CREATE OR REPLACE VIEW public.decrypted_provider_keys_v2 AS
        SELECT
          pk.id,
          pk.org_id,
          pk.provider_name,
          pk.provider_key_name,
          pk.vault_key_id,
          pk.soft_delete,
          pk.created_at,
          pk.provider_key,
          pk.provider_secret_key,

          -- decrypted_provider_key
          CASE
            WHEN pk.provider_key IS NULL OR pk.key_id IS NULL THEN NULL
            ELSE convert_from(
                   pgsodium.crypto_aead_det_decrypt(
                     decode(translate(pk.provider_key, '-_', '+/'), 'base64'),
                     convert_to(pk.org_id::text, 'utf8'),
                     pk.key_id,
                     pk.nonce),
                   'utf8')
          END AS decrypted_provider_key,

          -- decrypted_provider_secret_key
          CASE
            WHEN pk.provider_secret_key IS NULL OR pk.key_id IS NULL THEN NULL
            ELSE convert_from(
                   pgsodium.crypto_aead_det_decrypt(
                     decode(translate(pk.provider_secret_key, '-_', '+/'), 'base64'),
                     convert_to(pk.org_id::text, 'utf8'),
                     pk.key_id,
                     pk.nonce),
                   'utf8')
          END AS decrypted_provider_secret_key,

          pk.key_id,
          pk.auth_type,
          pk.nonce,
          pk.config,
          pk.cuid
        FROM public.provider_keys pk;
    ELSE
        CREATE OR REPLACE VIEW public.decrypted_provider_keys_v2 AS
        SELECT
          pk.id,
          pk.org_id,
          pk.provider_name,
          pk.provider_key_name,
          pk.vault_key_id,
          pk.soft_delete,
          pk.created_at,
          pk.provider_key,
          pk.provider_key as decrypted_provider_key, -- mock for local development
          pk.provider_secret_key,
          pk.provider_secret_key as decrypted_provider_secret_key, -- mock for local development
          pk.key_id,
          pk.auth_type,
          pk.nonce,
          pk.config,
          pk.cuid
        FROM public.provider_keys pk;
    END IF;

END $$; 