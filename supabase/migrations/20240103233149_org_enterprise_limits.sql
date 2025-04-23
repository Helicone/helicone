alter table "public"."organization" add column "limits" jsonb;

alter table "public"."organization" add column "org_provider_key" uuid;

alter table "public"."organization" add constraint "organization_org_provider_key_fkey" FOREIGN KEY (org_provider_key) REFERENCES provider_keys(id) ON DELETE SET NULL not valid;

alter table "public"."organization" validate constraint "organization_org_provider_key_fkey";


