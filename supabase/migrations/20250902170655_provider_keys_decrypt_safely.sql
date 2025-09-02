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
      create or replace view public.decrypted_provider_keys_v2 as
      with cleaned as (
        select
          pk.*,
          regexp_replace(pk.provider_key, '\s', '', 'g')        as pk_nowhite,
          regexp_replace(pk.provider_secret_key, '\s', '', 'g') as sk_nowhite
        from public.provider_keys pk
      ),
      norm as (
        select
          c.*,
          replace(replace(c.pk_nowhite, '-', '+'), '_', '/')    as pk_std,
          replace(replace(c.sk_nowhite, '-', '+'), '_', '/')    as sk_std
        from cleaned c
      ),
      repad as (
        select
          n.*,
          replace(n.pk_std, '=', '') ||
            repeat('=', (4 - length(replace(n.pk_std, '=', '')) % 4) % 4) as pk_padded,
          replace(n.sk_std, '=', '') ||
            repeat('=', (4 - length(replace(n.sk_std, '=', '')) % 4) % 4) as sk_padded
        from norm n
      ),
      decoded as (
        select
          r.*,
          case
            when r.pk_padded ~ '^[A-Za-z0-9+/]*$' and (length(r.pk_padded) % 4) <> 1
            then decode(r.pk_padded, 'base64')
            else null
          end as pk_ct,
          case
            when r.sk_padded ~ '^[A-Za-z0-9+/]*$' and (length(r.sk_padded) % 4) <> 1
            then decode(r.sk_padded, 'base64')
            else null
          end as sk_ct
        from repad r
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

        /* force C collation to match the existing view */
        (
          coalesce(
            public.try_det_decrypt_utf8(d.pk_ct, convert_to(d.org_id::text, 'utf8'), d.key_id, d.nonce),
            public.try_det_decrypt_utf8(d.pk_ct, ''::bytea,                           d.key_id, d.nonce)
          )
        )::text COLLATE "C" as decrypted_provider_key,

        (
          coalesce(
            public.try_det_decrypt_utf8(d.sk_ct, convert_to(d.org_id::text, 'utf8'), d.key_id, d.nonce),
            public.try_det_decrypt_utf8(d.sk_ct, ''::bytea,                           d.key_id, d.nonce)
          )
        )::text COLLATE "C" as decrypted_provider_secret_key,

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
