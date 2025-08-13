alter table "public"."request" add column "properties" jsonb;

create or replace view "public"."request_rbac" as  SELECT r.id,
    r.created_at,
    r.body,
    r.path,
    r.auth_hash,
    r.user_id,
    r.properties
   FROM (request r
     JOIN user_api_keys u ON ((r.auth_hash = u.api_key_hash)))
  WHERE (auth.uid() = u.user_id);


create or replace view "public"."response_and_request_rbac" as  SELECT response.body AS response_body,
    response.id AS response_id,
    response.created_at AS response_created_at,
    request.id AS request_id,
    request.body AS request_body,
    request.path AS request_path,
    request.created_at AS request_created_at,
    request.user_id AS request_user_id,
    user_api_keys.api_key_preview,
    user_api_keys.user_id,
    request.properties AS request_properties
   FROM ((response
     LEFT JOIN request ON ((request.id = response.request)))
     LEFT JOIN user_api_keys ON ((user_api_keys.api_key_hash = request.auth_hash)))
  WHERE (auth.uid() = user_api_keys.user_id);



