INSERT INTO org_properties_mv
SELECT arrayJoin(mapKeys(properties)) AS property,
    organization_id
FROM request_response_rmt
GROUP BY organization_id,
    property;