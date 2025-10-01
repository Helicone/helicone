ALTER TABLE default.request_response_rmt
  ADD INDEX idx_request_id_bf request_id TYPE bloom_filter(0.01) GRANULARITY 1;


ALTER TABLE default.request_response_rmt
  MATERIALIZE INDEX idx_request_id_bf;