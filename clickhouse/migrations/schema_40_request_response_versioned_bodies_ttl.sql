ALTER TABLE default.request_response_versioned
MODIFY COLUMN request_body String DEFAULT '' TTL toDateTime(request_created_at) + INTERVAL 3 MONTH,
MODIFY COLUMN response_body String DEFAULT '' TTL toDateTime(request_created_at) + INTERVAL 3 MONTH;