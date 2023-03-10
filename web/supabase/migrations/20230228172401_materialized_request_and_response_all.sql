-- This script was generated by the Schema Diff utility in pgAdmin 4
-- For the circular dependencies, the order in which Schema Diff writes the objects is not very sophisticated
-- and may require manual changes to the script to ensure changes are applied in the correct order.
-- Please report an issue for any failure with the reproduction steps.
set
    statement_timeout to 600000;

DROP MATERIALIZED VIEW IF EXISTS public.materialized_response_and_request;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.materialized_response_and_request TABLESPACE pg_default AS
SELECT
    response.id AS response_id,
    CASE
        WHEN request.cached_created_at IS NOT NULL THEN request.cached_created_at
        ELSE response.created_at
    END AS response_created_at,
    response.body AS response_body,
    request.id AS request_id,
    CASE
        WHEN request.cached_created_at IS NOT NULL THEN request.cached_created_at
        ELSE request.created_at
    END AS request_created_at,
    request.body AS request_body,
    request.path AS request_path,
    request.user_id AS request_user_id,
    request.properties AS request_properties,
    request.formatted_prompt_id as request_formatted_prompt_id,
    request.prompt_values as request_prompt_values,
    user_api_keys.api_key_preview as user_api_key_preview,
    user_api_keys.user_id as user_api_key_user_id,
    user_api_keys.api_key_hash as user_api_key_hash,
    prompt.name AS prompt_name,
    prompt.prompt AS prompt_regex,
    request.cached_created_at IS NOT NULL AS is_cached
FROM
    response
    LEFT JOIN (
        SELECT
            r.*,
            ch.created_at AS cached_created_at
        FROM
            request r
            LEFT JOIN cache_hits ch ON ch.request_id = r.id
        UNION
        SELECT
            r.*,
            NULL :: timestamp with time zone AS cached_created_at
        FROM
            request r
    ) request ON request.id = response.request
    LEFT JOIN user_api_keys ON user_api_keys.api_key_hash = request.auth_hash
    LEFT JOIN prompt ON request.formatted_prompt_id = prompt.id WITH DATA;

ALTER TABLE
    IF EXISTS public.materialized_response_and_request OWNER TO postgres;

GRANT ALL ON TABLE public.materialized_response_and_request TO postgres;

GRANT ALL ON TABLE public.materialized_response_and_request TO service_role;

REVOKE all PRIVILEGES on materialized_response_and_request
from
    authenticated;

REVOKE all PRIVILEGES on materialized_response_and_request
from
    anon;

set
    statement_timeout to 60000;