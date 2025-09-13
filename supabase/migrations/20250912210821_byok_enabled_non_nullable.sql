UPDATE provider_keys
SET byok_enabled = TRUE
WHERE byok_enabled IS NULL;

ALTER TABLE IF EXISTS provider_keys
  ALTER COLUMN byok_enabled SET DEFAULT TRUE,
  ALTER COLUMN byok_enabled SET NOT NULL;