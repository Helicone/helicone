create table "public"."prompts_2025" (
    "id" character varying not null,
    "organization" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "name" character varying,
    "tags" text[],
    "model" text not null,
    "production_version" uuid default gen_random_uuid()
);


alter table "public"."prompts_2025" enable row level security;

revoke all on table "public"."prompts_2025" from anon, authenticated, public;

create table "public"."prompts_2025_versions" (
    "created_at" timestamp with time zone not null default now(),
    "organization" uuid not null,
    "prompt_id" character varying not null,
    "major_version" integer not null,
    "minor_version" integer,
    "commit_message" text,
    "created_by" uuid default gen_random_uuid(),
    "id" uuid not null default gen_random_uuid()
);


alter table "public"."prompts_2025_versions" enable row level security;

revoke all on table "public"."prompts_2025_versions" from anon, authenticated, public;

CREATE UNIQUE INDEX prompts_2025_versions_pkey ON public.prompts_2025 USING btree (id);

CREATE UNIQUE INDEX prompts_2025_versions_pkey1 ON public.prompts_2025_versions USING btree (id);

alter table "public"."prompts_2025" add constraint "prompts_2025_versions_pkey" PRIMARY KEY using index "prompts_2025_versions_pkey";

alter table "public"."prompts_2025_versions" add constraint "prompts_2025_versions_pkey1" PRIMARY KEY using index "prompts_2025_versions_pkey1";

alter table "public"."prompts_2025" add constraint "prompts_2025_production_version_fkey" FOREIGN KEY (production_version) REFERENCES prompts_2025_versions(id) ON DELETE SET NULL not valid;

alter table "public"."prompts_2025" validate constraint "prompts_2025_production_version_fkey";

alter table "public"."prompts_2025" add constraint "prompts_2025_organization_fkey" FOREIGN KEY (organization) REFERENCES organization(id) ON DELETE CASCADE not valid;

alter table "public"."prompts_2025" validate constraint "prompts_2025_organization_fkey";

alter table "public"."prompts_2025_versions" add constraint "prompts_2025_versions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."prompts_2025_versions" validate constraint "prompts_2025_versions_created_by_fkey";

alter table "public"."prompts_2025_versions" add constraint "prompts_2025_versions_prompt_id_fkey" FOREIGN KEY (prompt_id) REFERENCES prompts_2025(id) ON DELETE CASCADE not valid;

alter table "public"."prompts_2025_versions" validate constraint "prompts_2025_versions_prompt_id_fkey";

alter table "public"."prompts_2025_versions" add constraint "prompts_2025_versions_organization_fkey" FOREIGN KEY (organization) REFERENCES organization(id) ON DELETE CASCADE not valid;

alter table "public"."prompts_2025_versions" validate constraint "prompts_2025_versions_organization_fkey";