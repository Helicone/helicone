CREATE SCHEMA IF NOT EXISTS vault;
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault" CASCADE;
ALTER TABLE provider_keys
ADD COLUMN provider_key TEXT NOT NULL,
    ADD COLUMN key_id uuid NOT NULL DEFAULT (pgsodium.create_key()).id REFERENCES pgsodium.key(id),
    ADD COLUMN nonce bytea NOT NULL DEFAULT pgsodium.crypto_aead_det_noncegen();
ALTER TABLE provider_keys
ALTER COLUMN vault_key_id DROP NOT NULL;
SECURITY LABEL FOR pgsodium ON COLUMN public.provider_keys.provider_key IS 'ENCRYPT WITH KEY COLUMN key_id NONCE nonce ASSOCIATED (org_id)';
GRANT USAGE ON SCHEMA pgsodium TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pgsodium TO service_role;
ALTER VIEW public.decrypted_provider_keys
SET (security_invoker = on);