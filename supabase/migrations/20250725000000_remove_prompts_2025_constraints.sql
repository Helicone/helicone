alter table "public"."prompts_2025" drop constraint if exists "prompts_2025_organization_fkey";

alter table "public"."prompts_2025_versions" drop constraint if exists "prompts_2025_versions_created_by_fkey";
alter table "public"."prompts_2025_versions" drop constraint if exists "prompts_2025_versions_prompt_id_fkey";
alter table "public"."prompts_2025_versions" drop constraint if exists "prompts_2025_versions_organization_fkey";

alter table "public"."prompts_2025_inputs" drop constraint if exists "prompts_2025_inputs_version_id_fkey";
alter table "public"."prompts_2025_inputs" drop constraint if exists "prompts_2025_inputs_request_id_fkey"; 