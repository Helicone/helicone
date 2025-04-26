alter table "public"."request" drop constraint "request_organization_id_fkey";


alter table "public"."request" drop column "organization_id";


CREATE OR REPLACE FUNCTION public.get_org_id(request_id uuid)
 RETURNS uuid
 LANGUAGE sql
AS $function$
with org_id as (select organization.id
from request
left join user_api_keys on user_api_keys.api_key_hash = request.auth_hash
left join organization on organization.owner = user_api_keys.user_id
where organization.is_personal = TRUE
and request.helicone_org_id is NULL
and request.id = request_id
LIMIT 1)
select org_id.id from org_id;
$function$
;
