DO $$
DECLARE has_pgsodium boolean := false;
BEGIN
SELECT EXISTS (
        SELECT 1
        FROM pg_extension
        WHERE extname = 'pgsodium'
    ) INTO has_pgsodium;
IF has_pgsodium THEN

DROP TRIGGER IF EXISTS provider_keys_encrypt_secret_trigger_provider_key ON provider_keys;

CREATE OR REPLACE FUNCTION provider_keys_encrypt_secret_provider_key() RETURNS trigger AS $func$ 
BEGIN 
    IF new.provider_key IS DISTINCT FROM old.provider_key THEN
        new.provider_key = CASE
            WHEN new.provider_key IS NULL THEN NULL
            ELSE CASE
                WHEN new.key_id IS NULL THEN NULL
                ELSE pg_catalog.encode(
                    pgsodium.crypto_aead_det_encrypt(
                        pg_catalog.convert_to(new.provider_key, 'utf8'),
                        pg_catalog.convert_to((new.org_id::text)::text, 'utf8'),
                        new.key_id::uuid,
                        new.nonce
                    ),
                    'base64'
                )
            END
        END;
    END IF;
    
    -- Only encrypt provider_secret_key if the value actually changed (handles both INSERT and UPDATE)
    IF new.provider_secret_key IS DISTINCT FROM old.provider_secret_key THEN
        new.provider_secret_key = CASE
            WHEN new.provider_secret_key IS NULL THEN NULL
            ELSE CASE
                WHEN new.key_id IS NULL THEN NULL
                ELSE pg_catalog.encode(
                    pgsodium.crypto_aead_det_encrypt(
                        pg_catalog.convert_to(new.provider_secret_key, 'utf8'),
                        pg_catalog.convert_to((new.org_id::text)::text, 'utf8'),
                        new.key_id::uuid,
                        new.nonce
                    ),
                    'base64'
                )
            END
        END;
    END IF;
    
    RETURN new;
END;
$func$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER provider_keys_encrypt_secret_trigger_provider_key BEFORE
INSERT
    OR
UPDATE ON provider_keys FOR EACH ROW EXECUTE FUNCTION provider_keys_encrypt_secret_provider_key();

END IF;
END $$;