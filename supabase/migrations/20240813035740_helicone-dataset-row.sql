-- Existing revoke statements
REVOKE ALL PRIVILEGES ON TABLE "public"."experiment_dataset_v2" FROM public;
REVOKE ALL PRIVILEGES ON TABLE "public"."experiment_dataset_v2_row" FROM public;
REVOKE ALL PRIVILEGES ON TABLE "public"."experiment_v2" FROM public;

-- Rename experiment_dataset_v2 to helicone_dataset
ALTER TABLE "public"."experiment_dataset_v2" RENAME TO "helicone_dataset";

-- Add soft delete column to helicone_dataset
ALTER TABLE "public"."helicone_dataset"
ADD COLUMN "deleted_at" timestamp with time zone;

-- Create index on deleted_at column
CREATE INDEX idx_helicone_dataset_deleted_at ON "public"."helicone_dataset" (deleted_at);

-- Create helicone_dataset_row table
CREATE TABLE "public"."helicone_dataset_row" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "origin_request_id" uuid NOT NULL,
    "organization_id" uuid NOT NULL,
    "dataset_id" uuid NOT NULL
);

-- Add index on organization_id column
CREATE INDEX idx_helicone_dataset_row_organization_id ON "public"."helicone_dataset_row" (organization_id);

-- Enable RLS
ALTER TABLE "public"."helicone_dataset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."helicone_dataset_row" ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraints
ALTER TABLE "public"."helicone_dataset_row" 
ADD CONSTRAINT "public_helicone_dataset_row_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organization(id);

ALTER TABLE "public"."helicone_dataset_row" 
ADD CONSTRAINT "public_helicone_dataset_row_dataset_id_fkey" FOREIGN KEY (dataset_id) REFERENCES helicone_dataset(id) ON UPDATE CASCADE;

-- Revoke privileges for new tables
REVOKE ALL PRIVILEGES ON TABLE "public"."helicone_dataset" FROM public;
REVOKE ALL PRIVILEGES ON TABLE "public"."helicone_dataset_row" FROM public;