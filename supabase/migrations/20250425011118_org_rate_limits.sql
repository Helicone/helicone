-- Function to handle automatic updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create the table
create table "public"."org_rate_limits" (
    "id" uuid primary key default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "organization_id" uuid not null references organization(id),
    "name" text not null,
    "quota" numeric not null,
    "window_seconds" integer not null,
    "unit" text not null,
    "segment" text, -- null for global
    "deleted_at" timestamp with time zone
);
CREATE INDEX org_rate_limits_organization_id_idx ON public.org_rate_limits USING btree (organization_id)
WHERE deleted_at IS NULL;
-- Create trigger for updated_at
CREATE TRIGGER on_org_rate_limits_update BEFORE
UPDATE ON public.org_rate_limits FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
-- Enable RLS for basic protection but revoke default access
alter table "public"."org_rate_limits" enable row level security;
REVOKE all PRIVILEGES on "public"."org_rate_limits"
from authenticated;
REVOKE all PRIVILEGES on "public"."org_rate_limits"
from anon;