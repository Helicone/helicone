ALTER TABLE public.helicone_api_keys
ADD COLUMN key_permissions text;
UPDATE public.helicone_api_keys
SET key_permissions = 'read+write';
ALTER TABLE public.helicone_api_keys
ALTER COLUMN key_permissions
SET DEFAULT 'write';