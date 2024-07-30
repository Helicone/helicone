ALTER TABLE default.request_response_versioned
ADD COLUMN request_body Nullable(String),
ADD COLUMN response_body Nullable(String)
AFTER assets;