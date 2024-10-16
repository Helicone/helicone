-- Create evaluator table
CREATE TABLE "public"."evaluator" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "scoring_type" text NOT NULL,
    "llm_template" jsonb,
    "organization_id" uuid NOT NULL,
    "name" text NOT NULL,
    "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable row level security
ALTER TABLE "public"."evaluator" ENABLE ROW LEVEL SECURITY;

-- Create primary key
CREATE UNIQUE INDEX evaluator_pkey ON public.evaluator USING btree (id);
ALTER TABLE "public"."evaluator" ADD CONSTRAINT "evaluator_pkey" PRIMARY KEY USING INDEX "evaluator_pkey";

-- Add foreign key constraint
ALTER TABLE "public"."evaluator"
ADD CONSTRAINT "evaluator_organization_id_fkey"
FOREIGN KEY (organization_id) REFERENCES organization(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Create index on scoring_type
CREATE INDEX idx_evaluator_scoring_type ON public.evaluator USING btree (scoring_type);

-- Revoke permissions
REVOKE ALL ON TABLE "public"."evaluator" FROM anon;
REVOKE ALL ON TABLE "public"."evaluator" FROM authenticated;

-- Create function to update 'updated_at' column
CREATE OR REPLACE FUNCTION update_evaluator_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update 'updated_at' column
CREATE TRIGGER update_evaluator_updated_at_trigger
BEFORE UPDATE ON public.evaluator
FOR EACH ROW
EXECUTE FUNCTION update_evaluator_updated_at();