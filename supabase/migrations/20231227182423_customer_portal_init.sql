ALTER TABLE organization
ADD COLUMN organization_type TEXT NOT NULL DEFAULT 'user';
ALTER TABLE public.organization
ADD COLUMN reseller_id UUID REFERENCES public.organization (id);
INSERT INTO storage.buckets (id, name, public)
VALUES (
    'organization_assets',
    'organization_assets',
    TRUE
  );
ALTER TABLE public.organization
ADD COLUMN logo_path TEXT;