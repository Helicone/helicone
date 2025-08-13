
alter table "public"."prompts" add column "name" text;

alter table "public"."prompts" add column "soft_delete" boolean not null default false;

