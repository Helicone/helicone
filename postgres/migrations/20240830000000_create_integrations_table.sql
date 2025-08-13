-- Create the integrations table
CREATE TABLE public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    integration_name TEXT NOT NULL,
    settings JSONB,
    active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES public.organization(id) ON DELETE CASCADE
);
-- Create a unique constraint to prevent duplicate integration names per organization
ALTER TABLE public.integrations
ADD CONSTRAINT unique_integration_per_org UNIQUE (organization_id, integration_name);
-- Create an index on organization_id for faster lookups
CREATE INDEX idx_integrations_organization_id ON public.integrations(organization_id);
-- Enable Row Level Security (RLS)
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE "public"."integrations"
FROM public;