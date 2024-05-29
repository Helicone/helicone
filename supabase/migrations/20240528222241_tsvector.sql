CREATE TABLE request_response_search (
    request_id uuid PRIMARY KEY,
    request_body_vector tsvector,
    response_body_vector tsvector
);

CREATE TEXT SEARCH DICTIONARY helicone_stopwords (
    TEMPLATE = snowball,
    Language = english,
    StopWords = english
);

CREATE TEXT SEARCH CONFIGURATION helicone_search_config (COPY = pg_catalog.english);

ALTER TEXT SEARCH CONFIGURATION helicone_search_config
    ALTER MAPPING FOR asciiword, asciihword, hword_asciipart
    WITH helicone_stopwords;