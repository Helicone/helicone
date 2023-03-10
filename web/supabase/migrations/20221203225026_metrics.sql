-- This script was generated by the Schema Diff utility in pgAdmin 4
-- For the circular dependencies, the order in which Schema Diff writes the objects is not very sophisticated
-- and may require manual changes to the script to ensure changes are applied in the correct order.
-- Please report an issue for any failure with the reproduction steps.

CREATE OR REPLACE VIEW public.metrics
WITH (security_invoker) AS
SELECT ( SELECT count(*) AS count
              FROM request) AS total_requests,
       (( SELECT count(*) AS count
              FROM request))::double precision / (( SELECT count(DISTINCT date_trunc('day'::text, request.created_at)) AS count
              FROM request))::double precision AS average_requests_per_day,
       ( SELECT avg(EXTRACT(epoch FROM response.created_at - request.created_at)) AS avg
              FROM request
              LEFT JOIN response ON response.request = request.id) AS average_response_time,
       ( SELECT avg((request.body ->> 'max_tokens'::text)::integer) AS avg
              FROM request) AS average_tokens_per_request,
       ( SELECT avg((((response.body ->> 'usage'::text)::json) ->> 'total_tokens'::text)::integer) AS avg
              FROM response) AS average_tokens_per_response;


GRANT ALL ON TABLE public.metrics TO service_role;
GRANT ALL ON TABLE public.metrics TO authenticated;
GRANT ALL ON TABLE public.metrics TO anon;
