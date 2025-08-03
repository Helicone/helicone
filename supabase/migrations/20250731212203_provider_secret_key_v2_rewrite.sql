-- =========================================================
-- 2025-08-03  Fix Base-64 issues in provider_keys workflow
-- =========================================================
--   • Trigger: still encrypts with pg_catalog.encode(...,'base64')
--   • View   : now decodes translate(col,'-_','+/')
--   • Data   : one-time UPDATE cleans old “-” / “_” chars
--   • ACL    : only service_role gets SELECT on the view
-- =========================================================

BEGIN;

------------------------------------------------------------------
-- 1. Ensure the AFTER/BEFORE trigger always stores RFC-2045 base64
------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.provider_keys_encrypt_secret_provider_key()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Encrypt + encode provider_key
  IF NEW.provider_key IS NOT NULL AND NEW.key_id IS NOT NULL THEN
    NEW.provider_key :=
      pg_catalog.encode(
        pgsodium.crypto_aead_det_encrypt(
          pg_catalog.convert_to(NEW.provider_key, 'utf8'),
          pg_catalog.convert_to(NEW.org_id::text, 'utf8'),
          NEW.key_id,
          NEW.nonce),
        'base64');                          -- produces RFC-2045 + / alphabet
  END IF;

  -- Encrypt + encode provider_secret_key
  IF NEW.provider_secret_key IS NOT NULL AND NEW.key_id IS NOT NULL THEN
    NEW.provider_secret_key :=
      pg_catalog.encode(
        pgsodium.crypto_aead_det_encrypt(
          pg_catalog.convert_to(NEW.provider_secret_key, 'utf8'),
          pg_catalog.convert_to(NEW.org_id::text, 'utf8'),
          NEW.key_id,
          NEW.nonce),
        'base64');
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'provider_keys_encrypt_secret_trigger_provider_key'
       AND tgrelid = 'public.provider_keys'::regclass) THEN
    CREATE TRIGGER provider_keys_encrypt_secret_trigger_provider_key
    BEFORE INSERT OR UPDATE ON public.provider_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.provider_keys_encrypt_secret_provider_key();
  END IF;
END;
$$;

---------------------------------------------------------------
-- 2. One-time data cleanup: convert any "-"/"_" to "+"/"/"
---------------------------------------------------------------
UPDATE public.provider_keys
SET
  provider_key        = translate(provider_key,        '-_', '+/'),
  provider_secret_key = translate(provider_secret_key, '-_', '+/')
WHERE
  provider_key        LIKE '%-%' OR provider_key        LIKE '%_%'
   OR provider_secret_key LIKE '%-%' OR provider_secret_key LIKE '%_%';

------------------------------------------------------------------
-- 3. Recreate the view with translate() fix (no duplicate cols)
------------------------------------------------------------------
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
  pk.config
FROM public.provider_keys pk;

------------------------------------------------------------------
-- 4. Permissions: only service_role can read the view
------------------------------------------------------------------
REVOKE ALL ON public.decrypted_provider_keys_v2 FROM anon, authenticated;
GRANT  SELECT ON public.decrypted_provider_keys_v2 TO service_role;

COMMIT;
