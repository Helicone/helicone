ALTER TABLE public.saved_queries
ADD COLUMN IF NOT EXISTS visualization_config JSONB DEFAULT NULL;