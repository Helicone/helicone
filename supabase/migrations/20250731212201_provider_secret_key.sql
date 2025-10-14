alter table "public"."provider_keys" add column "auth_type" text not null default 'key'::text;

alter table "public"."provider_keys" add column "provider_secret_key" text;

DROP TRIGGER IF EXISTS provider_keys_encrypt_secret_trigger_provider_key ON provider_keys;

-- Drop existing function if it exists to avoid permission issues
DROP FUNCTION IF EXISTS provider_keys_encrypt_secret_provider_key();

-- CREATE OR REPLACE FUNCTION provider_keys_encrypt_secret_provider_key() RETURNS trigger AS $$
-- 		BEGIN
-- 		        new.provider_key = CASE WHEN new.provider_key IS NULL THEN NULL ELSE
-- 			CASE WHEN new.key_id IS NULL THEN NULL ELSE pg_catalog.encode(
-- 			  pgsodium.crypto_aead_det_encrypt(
-- 				pg_catalog.convert_to(new.provider_key, 'utf8'),
-- 				pg_catalog.convert_to((new.org_id::text)::text, 'utf8'),
-- 				new.key_id::uuid,
-- 				new.nonce
-- 			  ),
-- 				'base64') END END;

-- 			new.provider_secret_key = CASE WHEN new.provider_secret_key IS NULL THEN NULL ELSE
-- 			CASE WHEN new.key_id IS NULL THEN NULL ELSE pg_catalog.encode(
-- 			  pgsodium.crypto_aead_det_encrypt(
-- 				pg_catalog.convert_to(new.provider_secret_key, 'utf8'),
-- 				pg_catalog.convert_to((new.org_id::text)::text, 'utf8'),
-- 				new.key_id::uuid,
-- 				new.nonce
-- 			  ),
-- 				'base64') END END;
-- 		RETURN new;
-- 		END;

-- $$ LANGUAGE plpgsql;

-- CREATE OR REPLACE TRIGGER provider_keys_encrypt_secret_trigger_provider_key
-- BEFORE INSERT OR UPDATE ON provider_keys
-- FOR EACH ROW EXECUTE FUNCTION provider_keys_encrypt_secret_provider_key();

-- Add missing columns that should have been added earlier
ALTER TABLE provider_keys ADD COLUMN IF NOT EXISTS key_id UUID DEFAULT NULL;
ALTER TABLE provider_keys ADD COLUMN IF NOT EXISTS nonce BYTEA DEFAULT NULL;

create view public.decrypted_provider_keys_v2 as
 SELECT provider_keys.id,
    provider_keys.org_id,
    provider_keys.provider_name,
    provider_keys.provider_key_name,
    provider_keys.vault_key_id,
    provider_keys.soft_delete,
    provider_keys.created_at,
    provider_keys.provider_key,
    provider_keys.provider_key as decrypted_provider_key, -- this is only for local mock
    provider_keys.provider_secret_key,
    provider_keys.provider_secret_key as decrypted_provider_secret_key, -- this is only for local mock
    -- provider_keys.provider_secret_key,
    --     CASE
    --         WHEN provider_keys.provider_key IS NULL THEN NULL::text
    --         ELSE
    --         CASE
    --             WHEN provider_keys.key_id IS NULL THEN NULL::text
    --             ELSE convert_from(pgsodium.crypto_aead_det_decrypt(decode(provider_keys.provider_key, 'base64'::text), convert_to(provider_keys.org_id::text, 'utf8'::name), provider_keys.key_id, provider_keys.nonce), 'utf8'::name)
    --         END
    --     END AS decrypted_provider_key,
    --     CASE
    --         WHEN provider_keys.provider_secret_key IS NULL THEN NULL::text
    --         ELSE
    --         CASE
    --             WHEN provider_keys.key_id IS NULL THEN NULL::text
    --             ELSE convert_from(pgsodium.crypto_aead_det_decrypt(decode(provider_keys.provider_secret_key, 'base64'::text), convert_to(provider_keys.org_id::text, 'utf8'::name), provider_keys.key_id, provider_keys.nonce), 'utf8'::name)
    --         END
    --     END AS decrypted_provider_secret_key,
    provider_keys.key_id,
    provider_keys.auth_type,
    provider_keys.nonce,
    provider_keys.config
   FROM provider_keys;


