CREATE TABLE provider_keys (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.organization(id),
    provider_name TEXT NOT NULL,
    provider_key_name TEXT NOT NULL,
    vault_key_id uuid NOT NULL,
    soft_delete BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT org_provider_key_name_uniq UNIQUE (org_id, provider_key_name)
);

ALTER TABLE
    public.provider_keys ENABLE ROW LEVEL SECURITY;

CREATE TABLE helicone_proxy_keys (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.organization(id),
    provider_key_id uuid NOT NULL REFERENCES public.provider_keys(id),
    helicone_proxy_key TEXT NOT NULL,
    helicone_proxy_key_name TEXT NOT NULL,
    soft_delete BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT org_helicone_key_name_uniq UNIQUE (org_id, helicone_proxy_key_name),
    CONSTRAINT helicone_key_id_provider_key_id_uniq UNIQUE (id, provider_key_id)
);

ALTER TABLE
    public.helicone_proxy_keys ENABLE ROW LEVEL SECURITY;