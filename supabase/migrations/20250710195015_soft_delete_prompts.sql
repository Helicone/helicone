alter table "public"."prompts_2025" add column "deleted" boolean not null default false;

alter table "public"."prompts_2025_versions" add column "deleted" boolean not null default false;
