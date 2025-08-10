ALTER TABLE response
ADD COLUMN helicone_org_id uuid null;
CREATE INDEX IF NOT EXISTS idx_response_body_model ON public.response USING btree (((body->>'model'::text))) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_response_created_at ON public.response USING btree (created_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_response_created_at_desc ON public.response USING btree (created_at DESC) TABLESPACE pg_default;
CREATE UNIQUE INDEX IF NOT EXISTS idx_response_request ON public.response USING btree (request) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS response_request_id ON public.response USING btree (request) TABLESPACE pg_default;
CREATE UNIQUE INDEX IF NOT EXISTS idx_response_request_helicone_org_id ON public.response (request, helicone_org_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_request_id_helicone_org_id ON public.request (id, helicone_org_id);