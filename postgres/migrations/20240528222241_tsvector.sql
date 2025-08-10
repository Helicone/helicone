CREATE TABLE IF NOT EXISTS public.request_response_search (
    id uuid primary key not null default gen_random_uuid(),
    request_id uuid not null,
    organization_id uuid not null,
    request_body_vector tsvector,
    response_body_vector tsvector,
    created_at timestamp with time zone not null default now()
);

CREATE UNIQUE INDEX IF NOT EXISTS request_response_search_unique ON public.request_response_search USING BTREE (request_id, organization_id);

DO $$
BEGIN
    ALTER TABLE "public"."request_response_search" ADD CONSTRAINT "request_response_search_request_id_fkey"
        FOREIGN KEY (request_id) REFERENCES request(id) ON UPDATE cascade ON DELETE CASCADE NOT valid;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'constraint request_response_search_request_id_fkey already exists, skipping';
END $$ LANGUAGE plpgsql;

DO $$
BEGIN
    ALTER TABLE "public"."request_response_search" ADD CONSTRAINT "request_response_search_organization_id_fkey"
        FOREIGN KEY (organization_id) references organization(id) ON UPDATE cascade ON DELETE CASCADE NOT valid;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'constraint request_response_search_organization_id_fkey already exists, skipping';
END $$ LANGUAGE plpgsql;

DO $$
BEGIN
    ALTER TABLE "public"."request_response_search" validate CONSTRAINT "request_response_search_request_id_fkey";
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'constraint request_response_search_request_id_fkey not present to validate, skipping';
END $$ LANGUAGE plpgsql;

DO $$
BEGIN
    ALTER TABLE "public"."request_response_search" validate CONSTRAINT "request_response_search_organization_id_fkey";
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'constraint request_response_search_organization_id_fkey not present to validate, skipping';
END $$ LANGUAGE plpgsql;


ALTER TABLE IF EXISTS public.request_response_search
    ENABLE ROW LEVEL SECURITY;

revoke all on public.request_response_search from anon, authenticated;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_ts_dict d
        JOIN pg_namespace n ON n.oid = d.dictnamespace
        WHERE d.dictname = 'helicone_stopwords' AND n.nspname = 'public'
    ) THEN
        EXECUTE 'CREATE TEXT SEARCH DICTIONARY helicone_stopwords (
            TEMPLATE = snowball,
            Language = english,
            StopWords = english
        )';
    END IF;
END $$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_ts_config c
        JOIN pg_namespace n ON n.oid = c.cfgnamespace
        WHERE c.cfgname = 'helicone_search_config' AND n.nspname = 'public'
    ) THEN
        EXECUTE 'CREATE TEXT SEARCH CONFIGURATION helicone_search_config (COPY = pg_catalog.english)';
    END IF;
END $$ LANGUAGE plpgsql;

DO $$
BEGIN
    -- Try to alter mapping; if it already exists, skip gracefully
    BEGIN
        EXECUTE 'ALTER TEXT SEARCH CONFIGURATION helicone_search_config
            ALTER MAPPING FOR asciiword, asciihword, hword_asciipart
            WITH helicone_stopwords';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'text search mapping already configured, skipping';
        WHEN undefined_object THEN
            RAISE NOTICE 'text search configuration missing; skipping mapping update';
    END;
END $$ LANGUAGE plpgsql;