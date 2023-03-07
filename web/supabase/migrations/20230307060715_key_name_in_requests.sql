create or replace view "public"."response_and_request_rbac" as  SELECT response.body AS response_body,
    response.id AS response_id,
        CASE
            WHEN (request.cached_created_at IS NOT NULL) THEN request.cached_created_at
            ELSE response.created_at
        END AS response_created_at,
    request.id AS request_id,
    request.body AS request_body,
    request.path AS request_path,
        CASE
            WHEN (request.cached_created_at IS NOT NULL) THEN request.cached_created_at
            ELSE request.created_at
        END AS request_created_at,
    request.user_id AS request_user_id,
    user_api_keys.api_key_preview,
    user_api_keys.user_id,
    request.properties AS request_properties,
    request.formatted_prompt_id,
    request.prompt_values,
    prompt.name AS prompt_name,
    prompt.prompt AS prompt_regex,
    (request.cached_created_at IS NOT NULL) AS is_cached,
    user_api_keys.key_name
   FROM (((response
     LEFT JOIN request_cache_rbac request ON ((request.id = response.request)))
     LEFT JOIN user_api_keys ON ((user_api_keys.api_key_hash = request.auth_hash)))
     LEFT JOIN prompt ON ((request.formatted_prompt_id = prompt.id)))
  WHERE (auth.uid() = user_api_keys.user_id);



