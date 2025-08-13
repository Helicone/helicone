alter table "public"."prompts_versions" add column "updated_at" timestamp with time zone not null default now();


