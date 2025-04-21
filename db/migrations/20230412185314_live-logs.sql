create policy "Enable read access for all users"
on "public"."request"
as permissive
for select
to public
using ((EXISTS ( SELECT user_api_keys.created_at,
    user_api_keys.api_key_hash,
    user_api_keys.api_key_preview,
    user_api_keys.user_id,
    user_api_keys.key_name
   FROM user_api_keys
  WHERE ((user_api_keys.user_id = auth.uid()) AND (request.auth_hash = user_api_keys.api_key_hash)))));


create policy "Enable select access for all users"
on "public"."response"
as permissive
for select
to public
using ((EXISTS ( SELECT request.id,
    request.created_at,
    request.body,
    request.path,
    request.auth_hash,
    request.user_id,
    request.prompt_id,
    request.properties,
    request.formatted_prompt_id,
    request.prompt_values,
    user_api_keys.created_at,
    user_api_keys.api_key_hash,
    user_api_keys.api_key_preview,
    user_api_keys.user_id,
    user_api_keys.key_name
   FROM (request
     LEFT JOIN user_api_keys ON ((user_api_keys.api_key_hash = request.auth_hash)))
  WHERE ((user_api_keys.user_id = auth.uid()) AND (request.id = response.request)))));



