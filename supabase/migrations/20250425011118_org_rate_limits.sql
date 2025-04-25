create table "public"."org_rate_limits" (
    "id" uuid primary key default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "organization_id" uuid not null references organization(id),
    "quota" numeric not null,
    "window_seconds" integer not null,
    "unit" text not null,
    "segment" text not null,
    "deleted_at" timestamp with time zone
);
CREATE INDEX org_rate_limits_organization_id_idx ON public.org_rate_limits USING btree (organization_id)
WHERE deleted_at IS NULL;
alter table "public"."org_rate_limits" enable row level security;
REVOKE all PRIVILEGES on "public"."org_rate_limits"
from authenticated;
REVOKE all PRIVILEGES on "public"."org_rate_limits"
from anon;