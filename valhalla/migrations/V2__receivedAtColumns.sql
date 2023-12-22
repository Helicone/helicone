ALTER TABLE public.response ADD COLUMN IF NOT EXISTS response_received_at timestamp with time zone not null default now();
ALTER TABLE public.request ADD COLUMN IF NOT EXISTS request_received_at timestamp with time zone not null default now();
ALTER TABLE public.response DROP COLUMN IF EXISTS feedback;
ALTER TABLE public.request ADD COLUMN IF NOT EXISTS model text null;
ALTER TABLE public.response ADD COLUMN IF NOT EXISTS helicone_org_id uuid null;
CREATE INDEX IF NOT EXISTS idx_request_model_org_id_created_at ON public.request USING btree (model, helicone_org_id, created_at desc) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_response_request_model ON public.response USING btree (request, model) TABLESPACE pg_default;