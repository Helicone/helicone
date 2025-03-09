-- Create a new table for GitHub integrations
CREATE TABLE IF NOT EXISTS public.github_integration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organization(id) ON DELETE CASCADE,
    repository_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Initializing',
    progress INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    error TEXT,
    pr_url TEXT,
    recent_logs JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_github_integration_organization_id ON public.github_integration(organization_id);
-- Add RLS policies
ALTER TABLE public.github_integration ENABLE ROW LEVEL SECURITY;
-- Policy for organization members to view their integrations
CREATE POLICY github_integration_select_policy ON public.github_integration FOR
SELECT USING (
        organization_id IN (
            SELECT organization_id
            FROM public.organization_member
            WHERE member = auth.uid()
        )
    );
-- Policy for organization members to insert integrations
CREATE POLICY github_integration_insert_policy ON public.github_integration FOR
INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM public.organization_member
            WHERE member = auth.uid()
        )
    );
-- Policy for organization members to update their integrations
CREATE POLICY github_integration_update_policy ON public.github_integration FOR
UPDATE USING (
        organization_id IN (
            SELECT organization_id
            FROM public.organization_member
            WHERE member = auth.uid()
        )
    );
-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_github_integration_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger to update the updated_at timestamp
CREATE TRIGGER update_github_integration_updated_at BEFORE
UPDATE ON public.github_integration FOR EACH ROW EXECUTE FUNCTION update_github_integration_updated_at();