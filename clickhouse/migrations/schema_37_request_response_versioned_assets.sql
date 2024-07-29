ALTER TABLE default.request_response_versioned
ADD COLUMN `assets` Map(LowCardinality(String), String) CODEC(ZSTD(1));