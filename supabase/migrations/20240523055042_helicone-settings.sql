CREATE TABLE IF NOT EXISTS public.helicone_settings (
    id uuid not null default gen_random_uuid(),
    name text not null,
    settings jsonb not null,
    created_at timestamp with time zone not null default now()
);
ALTER TABLE public.helicone_settings
ADD CONSTRAINT unique_name UNIQUE (name);
INSERT INTO public.helicone_settings (name, settings)
VALUES ('kafka:dlq', '{"miniBatchSize": 1}');
INSERT INTO public.helicone_settings (name, settings)
VALUES ('kafka:log', '{"miniBatchSize": 300}');