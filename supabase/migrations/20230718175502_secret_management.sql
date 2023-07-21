CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE TABLE provider_keys (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.organization(id),
    provider_name TEXT NOT NULL,
    provider_key TEXT NOT NULL,
    provider_key_name TEXT NOT NULL,
    key_id uuid not null DEFAULT uuid_generate_v4(),
    nonce bytea default pgsodium.crypto_aead_det_noncegen(),
    CONSTRAINT org_provider_key_name_uniq UNIQUE (org_id, provider_key_name)
);

SECURITY LABEL FOR pgsodium ON COLUMN public.provider_keys.provider_key IS 'ENCRYPT WITH KEY COLUMN key_id ASSOCIATED (org_id) NONCE nonce';

ALTER TABLE
    public.provider_keys ENABLE ROW LEVEL SECURITY;

CREATE TABLE proxy_key_mappings (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.organization(id),
    provider_key_id uuid NOT NULL REFERENCES public.provider_keys(id),
    helicone_proxy_key TEXT NOT NULL,
    helicone_proxy_key_name TEXT NOT NULL,
    CONSTRAINT org_helicone_key_name_uniq UNIQUE (org_id, helicone_proxy_key_name),
    CONSTRAINT helicone_key_id_provider_key_id_uniq UNIQUE (id, provider_key_id)
);

ALTER TABLE
    public.proxy_key_mappings ENABLE ROW LEVEL SECURITY;