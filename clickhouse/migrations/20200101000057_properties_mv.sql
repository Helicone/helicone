CREATE MATERIALIZED VIEW IF NOT EXISTS organization_properties_mv
TO organization_properties AS
SELECT
    organization_id,
    arrayJoin(mapKeys(properties)) AS property_key
FROM default.request_response_rmt
WHERE length(mapKeys(properties)) > 0