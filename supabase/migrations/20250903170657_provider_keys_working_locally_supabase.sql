DO $$
DECLARE has_pgsodium boolean := false;
BEGIN
SELECT EXISTS (
        SELECT 1
        FROM pg_extension
        WHERE extname = 'pgsodium'
    ) INTO has_pgsodium;
    IF has_pgsodium THEN
        CREATE OR REPLACE FUNCTION provider_keys_encrypt_secret_provider_key() RETURNS trigger AS $func$ BEGIN new.provider_key = CASE
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
        RETURN new;


        ALTER TABLE provider_keys ALTER COLUMN key_id SET DEFAULT (pgsodium.create_key()).id;

        ALTER TABLE provider_keys ALTER COLUMN nonce SET default pgsodium.crypto_aead_det_noncegen ();
    END;
$func$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER provider_keys_encrypt_secret_trigger_provider_key BEFORE
INSERT OR UPDATE ON provider_keys FOR EACH ROW EXECUTE FUNCTION provider_keys_encrypt_secret_provider_key();
END IF;
END $$;