CREATE OR REPLACE VIEW public.decrypted_provider_keys_v2 AS
WITH normalized AS (
  SELECT
    pk.*,
    CASE
      WHEN pk.provider_key IS NULL THEN NULL
      ELSE CASE
        WHEN length(translate(pk.provider_key, '-_', '+/')) % 4 = 0 THEN translate(pk.provider_key, '-_', '+/')
        WHEN length(translate(pk.provider_key, '-_', '+/')) % 4 = 2 THEN translate(pk.provider_key, '-_', '+/') || '=='
        WHEN length(translate(pk.provider_key, '-_', '+/')) % 4 = 3 THEN translate(pk.provider_key, '-_', '+/') || '='
        ELSE NULL
      END
    END AS padded_provider_key,

    CASE
      WHEN pk.provider_secret_key IS NULL THEN NULL
      ELSE CASE
        WHEN length(translate(pk.provider_secret_key, '-_', '+/')) % 4 = 0 THEN translate(pk.provider_secret_key, '-_', '+/')
        WHEN length(translate(pk.provider_secret_key, '-_', '+/')) % 4 = 2 THEN translate(pk.provider_secret_key, '-_', '+/') || '=='
        WHEN length(translate(pk.provider_secret_key, '-_', '+/')) % 4 = 3 THEN translate(pk.provider_secret_key, '-_', '+/') || '='
        ELSE NULL
      END
    END AS padded_provider_secret_key
  FROM provider_keys pk
)
SELECT
  id,
  org_id,
  provider_name,
  provider_key_name,
  vault_key_id,
  soft_delete,
  created_at,
  provider_key,
  provider_secret_key,

  CASE
    WHEN padded_provider_key IS NULL OR key_id IS NULL THEN NULL
    ELSE convert_from(
      pgsodium.crypto_aead_det_decrypt(
        decode(padded_provider_key, 'base64'),
        convert_to(org_id::text, 'utf8'),
        key_id,
        nonce
      ),
      'utf8'
    )
  END AS decrypted_provider_key,

  CASE
    WHEN padded_provider_secret_key IS NULL OR key_id IS NULL THEN NULL
    ELSE convert_from(
      pgsodium.crypto_aead_det_decrypt(
        decode(padded_provider_secret_key, 'base64'),
        convert_to(org_id::text, 'utf8'),
        key_id,
        nonce
      ),
      'utf8'
    )
  END AS decrypted_provider_secret_key,

  key_id,
  auth_type,
  nonce,
  config

FROM normalized
WHERE
  padded_provider_key IS NULL OR padded_provider_key ~ '^[A-Za-z0-9+/=]+$' -- filters invalid base64 chars
  AND padded_provider_secret_key IS NULL OR padded_provider_secret_key ~ '^[A-Za-z0-9+/=]+$';

REVOKE all PRIVILEGES on decrypted_provider_keys_v2
from
    authenticated;

REVOKE all PRIVILEGES on decrypted_provider_keys_v2
from
    service_role;

REVOKE all PRIVILEGES on decrypted_provider_keys_v2
from
    anonymous;

GRANT SELECT ON decrypted_provider_keys_v2 TO service_role;