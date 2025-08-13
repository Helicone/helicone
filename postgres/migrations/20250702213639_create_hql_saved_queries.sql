CREATE TABLE IF NOT EXISTS public.saved_queries
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL,
    name text NOT NULL,
    sql text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT saved_queries_pkey PRIMARY KEY (id),
    CONSTRAINT saved_queries_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organization(id)
);

-- Trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.saved_queries
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();