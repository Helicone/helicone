drop table "public"."request_response_search";
alter table "public"."response" drop column IF EXISTS "body";
-- Drop the dependent policy first
DROP POLICY IF EXISTS "Enable select access for all users" ON public.response;
-- Drop the policy on the request table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.request;
alter table "public"."request" drop column IF EXISTS "body";