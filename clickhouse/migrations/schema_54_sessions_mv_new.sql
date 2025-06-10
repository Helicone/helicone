CREATE MATERIALIZED VIEW session_rmt_mv_new TO session_rmt AS
SELECT
  properties['Helicone-Session-Id'] AS session_id,
  properties['Helicone-Session-Name'] AS session_name,
  *
FROM request_response_rmt
WHERE (has(properties, 'Helicone-Session-Id'))