INSERT INTO organization_properties (
    organization_id,
    property_key
)
SELECT
    organization_id,
    property_key
FROM
(
    SELECT
        organization_id,
        arrayJoin(mapKeys(properties)) AS property_key
    FROM request_response_rmt
    WHERE length(mapKeys(properties)) > 0
      AND request_created_at <= now()
      AND request_created_at >= now() - INTERVAL 60 DAY
)