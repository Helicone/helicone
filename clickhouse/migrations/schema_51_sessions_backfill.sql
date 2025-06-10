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