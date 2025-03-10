CREATE TABLE provider_configurations (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.organization(id),
    provider_name TEXT NOT NULL,
    provider_configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    soft_delete BOOLEAN NOT NULL DEFAULT FALSE
);
-- Create unique index for org_id and provider_name combinations
CREATE UNIQUE INDEX provider_configurations_org_id_provider_name_idx ON public.provider_configurations (org_id, provider_name)
WHERE soft_delete = FALSE;
-- Enable row level security
ALTER TABLE public.provider_configurations ENABLE ROW LEVEL SECURITY;
-- Revoke privileges from anon and authenticated
REVOKE ALL PRIVILEGES ON TABLE public.provider_configurations
FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.provider_configurations
FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.provider_configurations
FROM service_role;
-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_provider_configurations_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_provider_configurations_updated_at BEFORE
UPDATE ON public.provider_configurations FOR EACH ROW EXECUTE FUNCTION update_provider_configurations_updated_at();
-- Add foreign key to provider_keys table pointing to provider_configurations
ALTER TABLE public.provider_keys
ADD COLUMN provider_configuration_id UUID NULL REFERENCES public.provider_configurations(id);
-- Create index for performance
CREATE INDEX provider_keys_provider_configuration_id_idx ON public.provider_keys(provider_configuration_id);
-- Add version column to helicone_proxy_keys table
ALTER TABLE public.helicone_proxy_keys
ADD COLUMN version TEXT DEFAULT 'v1';