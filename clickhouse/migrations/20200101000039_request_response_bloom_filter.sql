ALTER TABLE default.request_response_versioned
MODIFY COLUMN request_body String DEFAULT '',
MODIFY COLUMN response_body String DEFAULT '',
ADD INDEX idx_request_body_bloom (request_body) TYPE ngrambf_v1(4, 1024, 1, 0) GRANULARITY 1,
ADD INDEX idx_response_body_bloom (response_body) TYPE ngrambf_v1(4, 1024, 1, 0) GRANULARITY 1;