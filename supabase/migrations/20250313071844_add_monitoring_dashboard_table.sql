-- force: true
-- Create monitoring_dashboard table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."monitoring_dashboard" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "config" JSONB NOT NULL,
    CONSTRAINT "monitoring_dashboard_org_id_user_id_key" UNIQUE ("organization_id", "user_id")
);

-- These operations are idempotent by nature
ALTER TABLE "public"."monitoring_dashboard" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."monitoring_dashboard" FROM anon, authenticated, public;

-- Add constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'monitoring_dashboard_user_id_fkey'
    ) THEN
        ALTER TABLE "public"."monitoring_dashboard" ADD CONSTRAINT "monitoring_dashboard_user_id_fkey" 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'monitoring_dashboard_organization_id_fkey'
    ) THEN
        ALTER TABLE "public"."monitoring_dashboard" ADD CONSTRAINT "monitoring_dashboard_organization_id_fkey" 
        FOREIGN KEY (organization_id) REFERENCES organization(id) ON UPDATE CASCADE ON DELETE CASCADE;
    END IF;
END
$$;

-- Create index on (organization_id, user_id) if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_monitoring_dashboard_org_user'
    ) THEN
        CREATE INDEX idx_monitoring_dashboard_org_user ON public.monitoring_dashboard (organization_id, user_id);
    END IF;
END
$$;

-- Create function to update 'updated_at' column if it doesn't exist
CREATE OR REPLACE FUNCTION update_monitoring_dashboard_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_monitoring_dashboard_updated_at_trigger'
    ) THEN
        CREATE TRIGGER update_monitoring_dashboard_updated_at_trigger
        BEFORE UPDATE ON public.monitoring_dashboard
        FOR EACH ROW
        EXECUTE FUNCTION update_monitoring_dashboard_updated_at();
    END IF;
END
$$;
