-- revoke all 

-- Then create the tables
CREATE TABLE "public"."experiment_table" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "experiment_id" uuid not null,
    "organization_id" uuid not null,
    "metadata" JSONB,
    "created_at" timestamp with time zone not null default now()
);

ALTER TABLE "public"."experiment_table"
ENABLE ROW LEVEL SECURITY;

revoke all on table "public"."experiment_table" from anon, authenticated;

CREATE TABLE "public"."experiment_column" (
    "id" uuid not null default gen_random_uuid(),
    "table_id" uuid not null,
    "column_name" text not null,
    "column_type" text not null,
    "metadata" JSONB,
    "created_at" timestamp with time zone not null default now()
);

ALTER TABLE "public"."experiment_column"
ENABLE ROW LEVEL SECURITY;

revoke all on table "public"."experiment_column" from anon, authenticated;

CREATE TABLE "public"."experiment_cell" (
    "id" uuid not null default gen_random_uuid(),
    "column_id" uuid not null,
    "row_index" integer not null,
    "value" text,
    "status" text,
    "metadata" JSONB,
    "created_at" timestamp with time zone not null default now()
);

revoke all on table "public"."experiment_cell" from anon, authenticated;


ALTER TABLE "public"."experiment_cell"
ENABLE ROW LEVEL SECURITY;

revoke all on table "public"."experiment_cell" from anon, authenticated;

-- Create all indexes first
CREATE UNIQUE INDEX experiment_table_pkey ON public.experiment_table USING btree (id);
CREATE UNIQUE INDEX experiment_column_pkey ON public.experiment_column USING btree (id);
CREATE UNIQUE INDEX experiment_cell_pkey ON public.experiment_cell USING btree (id);
CREATE UNIQUE INDEX experiment_cell_column_row_key ON public.experiment_cell USING btree (column_id, row_index);
-- Create an index on the metadata column for better query performance
CREATE INDEX idx_experiment_column_metadata ON experiment_column USING GIN (metadata);
CREATE INDEX idx_experiment_cell_metadata ON experiment_cell USING GIN (metadata);

-- Then add primary key constraints using the indexes
ALTER TABLE "public"."experiment_table"
ADD CONSTRAINT "experiment_table_pkey" PRIMARY KEY USING INDEX "experiment_table_pkey";

ALTER TABLE "public"."experiment_column"
ADD CONSTRAINT "experiment_column_pkey" PRIMARY KEY USING INDEX "experiment_column_pkey";

ALTER TABLE "public"."experiment_cell"
ADD CONSTRAINT "experiment_cell_pkey" PRIMARY KEY USING INDEX "experiment_cell_pkey";


-- Add foreign key constraints with not valid first
ALTER TABLE "public"."experiment_table"
ADD CONSTRAINT "experiment_table_experiment_id_fkey"
FOREIGN KEY (experiment_id) REFERENCES experiment_v2(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;

ALTER TABLE "public"."experiment_table"
ADD CONSTRAINT "experiment_table_organization_id_fkey"
FOREIGN KEY (organization_id) REFERENCES organization(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;

ALTER TABLE "public"."experiment_column"
ADD CONSTRAINT "experiment_column_table_id_fkey"
FOREIGN KEY (table_id) REFERENCES experiment_table(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;

ALTER TABLE "public"."experiment_cell"
ADD CONSTRAINT "experiment_cell_column_id_fkey"
FOREIGN KEY (column_id) REFERENCES experiment_column(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;

-- Then validate the constraints
ALTER TABLE "public"."experiment_table"
VALIDATE CONSTRAINT "experiment_table_experiment_id_fkey";

ALTER TABLE "public"."experiment_column"
VALIDATE CONSTRAINT "experiment_column_table_id_fkey";

ALTER TABLE "public"."experiment_cell"
VALIDATE CONSTRAINT "experiment_cell_column_id_fkey";
