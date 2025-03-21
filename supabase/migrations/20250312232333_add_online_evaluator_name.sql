-- Add name column to online_evaluators table
ALTER TABLE public.online_evaluators
ADD COLUMN name VARCHAR(128) DEFAULT NULL;
COMMENT ON COLUMN public.online_evaluators.name IS 'Stores the name of the online evaluator';