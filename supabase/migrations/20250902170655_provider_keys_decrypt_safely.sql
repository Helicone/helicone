-- Create safer decryption function with improved error handling
create or replace function try_det_decrypt_utf8(ct bytea, aad bytea, key_id uuid, nonce bytea)
returns text
language plpgsql
immutable
as $$
begin
  -- Input validation
  if ct is null or length(ct) = 0 then
    return null;
  end if;
  
  return convert_from(pgsodium.crypto_aead_det_decrypt(ct, aad, key_id, nonce), 'utf8');
exception 
  when invalid_parameter_value then 
    return null;
  when others then
    -- Log error details for debugging while still returning null
    raise debug 'Decryption failed: %', sqlerrm;
    return null;
end;
$$;

REVOKE ALL ON FUNCTION try_det_decrypt_utf8(bytea, bytea, uuid, bytea) FROM anon, authenticated;

-- Conditional migration for provider_keys
-- Checks if pgsodium is available and applies appropriate migration

DO $$
DECLARE
    has_pgsodium boolean := false;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pgsodium'
    ) INTO has_pgsodium;

    -- Create view based on pgsodium availability
    IF has_pgsodium THEN
        -- Production view with pgsodium encryption
        CREATE OR REPLACE VIEW public.decrypted_provider_keys_v2 AS
        WITH base AS (
            SELECT
                pk.*,
                -- Normalize alphabet then strip ALL whitespace
                -- Only process non-null, non-empty keys
                CASE 
                    WHEN pk.provider_key IS NOT NULL AND length(pk.provider_key) > 0
                    THEN regexp_replace(translate(pk.provider_key, '-_', '+/'), '\s', '', 'g')
                    ELSE NULL
                END AS pk_nowhite,
                CASE
                    WHEN pk.provider_secret_key IS NOT NULL AND length(pk.provider_secret_key) > 0
                    THEN regexp_replace(translate(pk.provider_secret_key, '-_', '+/'), '\s', '', 'g')
                    ELSE NULL
                END AS sk_nowhite
            FROM public.provider_keys pk
        ),
        decoded AS (
            SELECT
                b.*,
                -- Provider key: decode with validation
                CASE
                    WHEN b.pk_nowhite IS NULL THEN NULL
                    WHEN b.pk_nowhite ~ '^[A-Za-z0-9+/]+={0,2}$' AND length(b.pk_nowhite) > 0
                        THEN decode(b.pk_nowhite, 'base64')
                    WHEN length(b.pk_nowhite) > 0
                        THEN decode(
                            replace(b.pk_nowhite, '=', '') ||
                            repeat('=', (4 - length(replace(b.pk_nowhite, '=', '')) % 4) % 4),
                            'base64'
                        )
                    ELSE NULL
                END AS pk_ct,
                -- Provider secret key: same logic
                CASE
                    WHEN b.sk_nowhite IS NULL THEN NULL
                    WHEN b.sk_nowhite ~ '^[A-Za-z0-9+/]+={0,2}$' AND length(b.sk_nowhite) > 0
                        THEN decode(b.sk_nowhite, 'base64')
                    WHEN length(b.sk_nowhite) > 0
                        THEN decode(
                            replace(b.sk_nowhite, '=', '') ||
                            repeat('=', (4 - length(replace(b.sk_nowhite, '=', '')) % 4) % 4),
                            'base64'
                        )
                    ELSE NULL
                END AS sk_ct
            FROM base b
        )
        SELECT
            d.id,
            d.org_id,
            d.provider_name,
            d.provider_key_name,
            d.vault_key_id,
            d.soft_delete,
            d.created_at,
            d.provider_key,
            d.provider_secret_key,
            -- Dual decryption: try with org_id as AAD first, then fallback to empty AAD
            COALESCE(
                public.try_det_decrypt_utf8(d.pk_ct, convert_to(d.org_id::text, 'utf8'), d.key_id, d.nonce),
                public.try_det_decrypt_utf8(d.pk_ct, ''::bytea, d.key_id, d.nonce)
            ) COLLATE "C" AS decrypted_provider_key,
            COALESCE(
                public.try_det_decrypt_utf8(d.sk_ct, convert_to(d.org_id::text, 'utf8'), d.key_id, d.nonce),
                public.try_det_decrypt_utf8(d.sk_ct, ''::bytea, d.key_id, d.nonce)
            ) COLLATE "C" AS decrypted_provider_secret_key,
            d.key_id,
            d.auth_type,
            d.nonce,
            d.config,
            d.cuid,
            d.byok_enabled
        FROM decoded d;
    ELSE
        -- Development view without pgsodium
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
            pk.provider_key AS decrypted_provider_key, -- Mock for local development
            pk.provider_secret_key,
            pk.provider_secret_key AS decrypted_provider_secret_key, -- Mock for local development
            pk.key_id,
            pk.auth_type,
            pk.nonce,
            pk.config,
            pk.cuid,
            pk.byok_enabled
        FROM public.provider_keys pk;
    END IF;

END $$;

-- Revoke permissions for security
REVOKE ALL ON decrypted_provider_keys_v2 FROM anon, authenticated;

-- Add comment for documentation
COMMENT ON VIEW public.decrypted_provider_keys_v2 IS 
'Safe decryption view for provider keys with dual AAD fallback and robust base64 handling';