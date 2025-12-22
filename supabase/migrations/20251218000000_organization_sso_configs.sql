-- Create table for organization SSO configurations
CREATE TABLE IF NOT EXISTS "public"."organization_sso_config" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL REFERENCES "public"."organization"("id") ON DELETE CASCADE,
  "domain" TEXT NOT NULL,
  "provider_id" TEXT,
  "metadata_url" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- One SSO config per organization
  CONSTRAINT "organization_sso_config_org_unique" UNIQUE ("organization_id"),
  -- Domain must be unique across all organizations
  CONSTRAINT "organization_sso_config_domain_unique" UNIQUE ("domain")
);

-- Add index for domain lookups (used during sign-in)
CREATE INDEX IF NOT EXISTS "organization_sso_config_domain_idx"
  ON "public"."organization_sso_config"("domain")
  WHERE "enabled" = true;

-- Add index for organization lookups
CREATE INDEX IF NOT EXISTS "organization_sso_config_org_idx"
  ON "public"."organization_sso_config"("organization_id");

-- Enable Row Level Security
ALTER TABLE "public"."organization_sso_config" ENABLE ROW LEVEL SECURITY;

-- Revoke access from anon and authenticated (access via service role only)
REVOKE ALL PRIVILEGES ON TABLE "public"."organization_sso_config" FROM anon;
REVOKE ALL PRIVILEGES ON TABLE "public"."organization_sso_config" FROM authenticated;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organization_sso_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION public.update_organization_sso_config_updated_at()
    OWNER TO postgres;

CREATE TRIGGER update_organization_sso_config_updated_at
  BEFORE UPDATE ON "public"."organization_sso_config"
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_sso_config_updated_at();
