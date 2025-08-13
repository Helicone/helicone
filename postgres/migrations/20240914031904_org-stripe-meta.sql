alter table "public"."organization"
add column "stripe_metadata" jsonb not null default '{}'::jsonb;