CREATE TABLE provider_keys (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.organization(id),
    provider_name TEXT NOT NULL,
    provider_key_name TEXT NOT NULL,
    vault_key_id uuid NOT NULL,
    soft_delete BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX org_provider_key_name_not_deleted_uniq
    ON public.provider_keys (org_id, provider_key_name)
    WHERE soft_delete = FALSE;

ALTER TABLE
    public.provider_keys ENABLE ROW LEVEL SECURITY;

CREATE TABLE helicone_proxy_keys (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.organization(id),
    provider_key_id uuid NOT NULL REFERENCES public.provider_keys(id),
    helicone_proxy_key TEXT NOT NULL,
    helicone_proxy_key_name TEXT NOT NULL,
    soft_delete BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX org_helicone_key_name_not_deleted_uniq
    ON helicone_proxy_keys (org_id, helicone_proxy_key_name)
    WHERE soft_delete = FALSE;

ALTER TABLE
    public.helicone_proxy_keys ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION soft_delete_helicone_proxy_keys() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.soft_delete = TRUE THEN
        UPDATE helicone_proxy_keys SET soft_delete = TRUE WHERE provider_key_id = NEW.id;
    END IF;
    RETURN NEW;
END
$$;

CREATE TRIGGER soft_delete_helicone_proxy_keys
AFTER UPDATE OF soft_delete ON public.provider_keys
FOR EACH ROW EXECUTE FUNCTION soft_delete_helicone_proxy_keys();