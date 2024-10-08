INSERT INTO default.request_response_rmt
SELECT
    response_id,
    response_created_at,
    latency,
    status,
    completion_tokens,
    prompt_tokens,
    model,
    request_id,
    request_created_at,
    user_id,
    organization_id,
    proxy_key_id,
    threat,
    time_to_first_token,
    provider,
    target_url,
    country_code,
    properties,
    scores,
    request_body,
    response_body,
    assets,
    now() as updated_at
FROM default.request_response_versioned
