CREATE MATERIALIZED VIEW session_rmt_mv TO session_rmt AS
SELECT
  properties['Helicone-Session-Id'] AS session_id,
  properties['Helicone-Session-Name'] AS session_name,
  response_id,
  response_created_at,
  latency,
  status,
  completion_tokens,
  completion_audio_tokens,
  cache_reference_id,
  prompt_tokens,
  prompt_cache_write_tokens,
  prompt_cache_read_tokens,
  prompt_audio_tokens,
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
  cache_enabled,
  properties,
  scores,
  request_body,
  response_body,
  assets,
  updated_at
FROM request_response_rmt
WHERE (has(properties, 'Helicone-Session-Id'))

-- insert the last 30 days worth of data from request_respnose_rmt into session_rmt that hasn't already been inserted
INSERT INTO session_rmt
WITH
    if(
        (SELECT count() FROM session_rmt) = 0,
        now(),
        (SELECT min(request_created_at) FROM session_rmt)
    ) AS earliest_date
SELECT
    properties['Helicone-Session-Id'] AS session_id,
    properties['Helicone-Session-Name'] AS session_name,
    *
FROM request_response_rmt
WHERE
    request_created_at > earliest_date - INTERVAL 30 DAY
    AND request_created_at < earliest_date
    AND has(mapKeys(properties), 'Helicone-Session-Id')