alter table "public"."organization" add column "governance_settings" jsonb;

alter table "public"."organization_member" add column "governance_limits" jsonb;


