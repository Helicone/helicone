INSERT INTO default.request_response_versioned
(
    response_id, response_created_at, latency, status, completion_tokens, prompt_tokens, model, request_id, request_created_at, user_id, organization_id, threat, time_to_first_token,
    provider,
    target_url, country_code, created_at,
    sign,
    version,
    properties
)
SELECT
    response_id, response_created_at, latency, status, completion_tokens, prompt_tokens, model, request_id, request_created_at, user_id, organization_id, threat, time_to_first_token,
    coalesce(provider, 'default_provider'),
    target_url, country_code, created_at,
    1 AS sign,
    0,
    map()
FROM request_response_log