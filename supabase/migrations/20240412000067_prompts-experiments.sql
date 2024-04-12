drop policy "Enable select access for all users" on "public"."response";

revoke delete on table "public"."prompt" from "anon";

revoke insert on table "public"."prompt" from "anon";

revoke references on table "public"."prompt" from "anon";

revoke select on table "public"."prompt" from "anon";

revoke trigger on table "public"."prompt" from "anon";

revoke truncate on table "public"."prompt" from "anon";

revoke update on table "public"."prompt" from "anon";

revoke delete on table "public"."prompt" from "authenticated";

revoke insert on table "public"."prompt" from "authenticated";

revoke references on table "public"."prompt" from "authenticated";

revoke select on table "public"."prompt" from "authenticated";

revoke trigger on table "public"."prompt" from "authenticated";

revoke truncate on table "public"."prompt" from "authenticated";

revoke update on table "public"."prompt" from "authenticated";

revoke delete on table "public"."prompt" from "service_role";

revoke insert on table "public"."prompt" from "service_role";

revoke references on table "public"."prompt" from "service_role";

revoke select on table "public"."prompt" from "service_role";

revoke trigger on table "public"."prompt" from "service_role";

revoke truncate on table "public"."prompt" from "service_role";

revoke update on table "public"."prompt" from "service_role";

alter table "public"."request" drop constraint "request_formatted_prompt_id_fkey";

drop materialized view if exists "public"."materialized_response_and_request";

drop view if exists "public"."response_and_request_rbac";

drop view if exists "public"."metrics_rbac";

drop view if exists "public"."model_metrics";

drop view if exists "public"."user_metrics_rbac";

drop view if exists "public"."request_cache_rbac";

drop view if exists "public"."request_rbac";

drop view if exists "public"."response_rbac";

alter table "public"."prompt" drop constraint "prompt_pkey";

drop index if exists "public"."prompt_pkey";

drop table "public"."prompt";

alter table "public"."request" drop column "formatted_prompt_id";

