CREATE TABLE request_response_search (
    request_id uuid PRIMARY KEY,
    request_body_vector tsvector,
    response_body_vector tsvector
);
