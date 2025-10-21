-- Create table to track hidden property keys per organization
CREATE TABLE IF NOT EXISTS public.helicone_hidden_property_keys (
  organization_id uuid NOT NULL,
  key text NOT NULL,
  is_hidden boolean NOT NULL DEFAULT TRUE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT helicone_hidden_property_keys_pkey PRIMARY KEY (organization_id, key)
);

-- Grants (adjust to your environment)
GRANT ALL ON TABLE public.helicone_hidden_property_keys TO postgres;
GRANT SELECT, INSERT, UPDATE ON TABLE public.helicone_hidden_property_keys TO authenticated;
GRANT SELECT ON TABLE public.helicone_hidden_property_keys TO anon;

