alter table "public"."experiment_v3" add column "input_keys" text[] default '{}'::text[];

alter table "public"."prompts_versions" add column "parent_prompt_version" uuid;

alter table "public"."prompts_versions" add constraint "public_prompts_versions_parent_prompt_version_fkey" FOREIGN KEY (parent_prompt_version) REFERENCES prompts_versions(id) not valid;

alter table "public"."prompts_versions" validate constraint "public_prompts_versions_parent_prompt_version_fkey";


