CREATE TABLE request_response_search (
    id uuid not null default gen_random_uuid(),
    request_id uuid not null,
    organization_id uuid not null,
    request_body_vector tsvector,
    response_body_vector tsvector
);

CREATE UNIQUE INDEX request_response_search_unique ON public.request_response_search USING BTREE (request_id, organization_id);

ALTER TABLE "public"."request_response_search" ADD CONSTRAINT "request_response_search_layout_pkey" PRIMARY KEY USING INDEX "request_response_search_pkey";

ALTER TABLE "public"."request_response_search" ADD CONSTRAINT "request_response_search_request_id_fkey" FOREIGN KEY (request_id) REFERENCES request(id) ON UPDATE cascade ON DELETE CASCADE NOT valid;

ALTER TABLE "public"."request_response_search" ADD CONSTRAINT "request_response_search_organization_id_fkey" FOREIGN KEY (organization_id) references organization(id) ON UPDATE cascade ON DELETE CASCADE NOT valid;

ALTER TABLE "public"."request_response_search" validate CONSTRAINT "request_response_search_request_id_fkey";

ALTER TABLE "public"."request_response_search" validate CONSTRAINT "request_response_search_organization_id_fkey";

CREATE TEXT SEARCH DICTIONARY helicone_stopwords (
    TEMPLATE = snowball,
    Language = english,
    StopWords = english
);

CREATE TEXT SEARCH CONFIGURATION helicone_search_config (COPY = pg_catalog.english);

ALTER TEXT SEARCH CONFIGURATION helicone_search_config
    ALTER MAPPING FOR asciiword, asciihword, hword_asciipart
    WITH helicone_stopwords;