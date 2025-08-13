alter table "public"."prompts_2025" add column "soft_delete" boolean not null default false;

alter table "public"."prompts_2025_versions" add column "soft_delete" boolean not null default false;
