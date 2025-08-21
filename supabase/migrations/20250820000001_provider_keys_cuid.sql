ALTER TABLE public.provider_keys
ADD COLUMN cuid TEXT DEFAULT NULL;

ALTER TABLE public.provider_keys
ADD CONSTRAINT provider_keys_cuid_unique UNIQUE (cuid);