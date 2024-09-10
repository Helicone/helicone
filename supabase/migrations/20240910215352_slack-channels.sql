alter table "public"."alert" add column "slack_channels" text[] not null default '{}'::text[];
