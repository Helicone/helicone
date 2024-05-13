ALTER TABLE response
ADD COLUMN helicone_org_id uuid null;
ALTER TABLE response
ADD CONSTRAINT unique_request_helicone_org_id UNIQUE (request, helicone_org_id);
ALTER TABLE request
ADD CONSTRAINT unique_id_helicone_org_id UNIQUE (id, helicone_org_id);
CREATE INDEX IF NOT EXISTS idx_response_body_model ON public.response USING btree (((body->>'model'::text))) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_response_created_at ON public.response USING btree (created_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_response_created_at_desc ON public.response USING btree (created_at DESC) TABLESPACE pg_default;
CREATE UNIQUE INDEX IF NOT EXISTS idx_response_request ON public.response USING btree (request) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS response_request_id ON public.response USING btree (request) TABLESPACE pg_default;