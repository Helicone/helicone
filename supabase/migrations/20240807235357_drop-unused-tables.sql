alter table "public"."experiment_dataset_values" drop constraint "experiment_dataset_values_dataset_id_fkey";

alter table "public"."experiment_dataset_values" drop constraint "experiment_dataset_values_request_id_fkey";

alter table "public"."experiment_dataset_values" drop constraint "experiment_dataset_values_result_request_id_fkey";

alter table "public"."experiment_dataset_values" drop constraint "experiment_dataset_values_pkey";

drop index if exists "public"."experiment_dataset_values_pkey";

drop table "public"."experiment_dataset_values";

alter table "public"."experiment_dataset_v2" add column "dataset_type" text not null default 'experiment'::text;





alter table "public"."experiment_dataset" drop constraint "experiment_dataset_organization_id_fkey";

alter table "public"."experiments" drop constraint "experiments_dataset_fkey";

alter table "public"."experiments" drop constraint "experiments_organization_id_fkey";

alter table "public"."experiments" drop constraint "experiments_origin_prompt_fkey";

alter table "public"."experiments" drop constraint "experiments_provider_key_fkey";

alter table "public"."experiments" drop constraint "experiments_result_dataset_fkey";

alter table "public"."experiments" drop constraint "experiments_test_prompt_fkey";

alter table "public"."prompts" drop constraint "prompts_organization_id_fkey";

alter table "public"."prompts" drop constraint "prompts_uuid_key";

alter table "public"."request" drop constraint "request_formatted_prompt_id_fkey";

alter table "public"."experiment_dataset" drop constraint "prompt_dataset_pkey";

alter table "public"."experiments" drop constraint "experiments_pkey";

alter table "public"."prompt" drop constraint "prompt_pkey";

alter table "public"."prompts" drop constraint "prompts_pkey";

drop index if exists "public"."experiments_pkey";

drop index if exists "public"."prompt_dataset_pkey";

drop index if exists "public"."prompt_pkey";

drop index if exists "public"."prompts_pkey";

drop index if exists "public"."prompts_uuid_key";

drop table "public"."experiment_dataset";

drop table "public"."experiments";

drop table "public"."prompt";

drop table "public"."prompts";


