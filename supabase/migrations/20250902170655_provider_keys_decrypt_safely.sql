create or replace function try_det_decrypt_utf8(ct bytea, aad bytea, key_id uuid, nonce bytea)
returns text
language plpgsql
immutable
as $$
begin
  return convert_from(pgsodium.crypto_aead_det_decrypt(ct, aad, key_id, nonce), 'utf8');
exception when others then
  return null;
end;
$$;


REVOKE ALL ON FUNCTION try_det_decrypt_utf8(bytea, bytea, uuid, bytea) FROM anon, authenticated;

-- Conditional migration for provider_keys cuid column
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
      with base as (
        select
          pk.*,
          -- normalize alphabet then strip ALL whitespace
          regexp_replace(translate(pk.provider_key, '-_', '+/'), '\s', '', 'g')        as pk_nowhite,
          regexp_replace(translate(pk.provider_secret_key, '-_', '+/'), '\s', '', 'g') as sk_nowhite
        from public.provider_keys pk
      ),
      decoded as (
        select
          b.*,

          -- provider_key: decode "as-is" if it already looks like clean base64; else sanitize
          case
            when b.pk_nowhite ~ '^[A-Za-z0-9+/]+={0,2}$'
              then decode(b.pk_nowhite, 'base64')
            else
              decode(
                replace(b.pk_nowhite, '=', '') ||
                repeat('=', (4 - length(replace(b.pk_nowhite, '=', '')) % 4) % 4),
                'base64'
              )
          end as pk_ct,

          -- provider_secret_key: same logic
          case
            when b.sk_nowhite ~ '^[A-Za-z0-9+/]+={0,2}$'
              then decode(b.sk_nowhite, 'base64')
            else
              decode(
                replace(b.sk_nowhite, '=', '') ||
                repeat('=', (4 - length(replace(b.sk_nowhite, '=', '')) % 4) % 4),
                'base64'
              )
          end as sk_ct
        from base b
      )
      select
        d.id,
        d.org_id,
        d.provider_name,
        d.provider_key_name,
        d.vault_key_id,
        d.soft_delete,
        d.created_at,
        d.provider_key,
        d.provider_secret_key,

        public.try_det_decrypt_utf8(d.pk_ct, convert_to(d.org_id::text, 'utf8'), d.key_id, d.nonce)
          COLLATE "C" as decrypted_provider_key,

        public.try_det_decrypt_utf8(d.sk_ct, convert_to(d.org_id::text, 'utf8'), d.key_id, d.nonce)
          COLLATE "C" as decrypted_provider_secret_key,

        d.key_id,
        d.auth_type,
        d.nonce,
        d.config,
        d.cuid,
        d.byok_enabled
      from decoded d;
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
          pk.cuid,
          pk.byok_enabled
        FROM public.provider_keys pk;
    END IF;

END $$;


REVOKE ALL ON decrypted_provider_keys_v2 FROM anon, authenticated;
