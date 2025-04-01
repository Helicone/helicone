drop table "public"."request_response_search";
alter table "public"."response" drop column "body";
-- Drop the dependent policy first
DROP POLICY "Enable select access for all users" ON public.response;
-- Drop the policy on the request table
DROP POLICY "Enable read access for all users" ON public.request;
alter table "public"."request" drop column "body";