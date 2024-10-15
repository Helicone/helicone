ALTER TABLE default.request_response_versioned
ADD COLUMN assets Array(String) CODEC(ZSTD(1))
AFTER scores;