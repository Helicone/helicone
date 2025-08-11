INSERT INTO default.request_response_versioned
(
    response_id, response_created_at, latency, status, completion_tokens, prompt_tokens, model, request_id, request_created_at, user_id, organization_id, threat, time_to_first_token, provider, country_code,
    sign,
    version,
    properties
)
SELECT 
    response_id, response_created_at, latency, status, completion_tokens, prompt_tokens, model, request_id, request_created_at, user_id, organization_id, threat, time_to_first_token, provider, country_code,
    -1,
    0,
    map()
FROM property_with_response_v1
GROUP BY 
    organization_id, user_id, request_created_at, status,  model,  request_id, latency, status, completion_tokens, prompt_tokens, model, threat, time_to_first_token, country_code, response_created_at, response_id, provider
