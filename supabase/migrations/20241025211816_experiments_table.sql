
-- Then create the tables
CREATE TABLE "public"."experiment_table" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "experiment_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
);

ALTER TABLE "public"."experiment_table"
ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."experiment_columns" (
    "id" uuid not null default gen_random_uuid(),
    "table_id" uuid not null,
    "column_name" text not null,
    "column_type" text not null,
    "created_at" timestamp with time zone not null default now()
);

ALTER TABLE "public"."experiment_columns"
ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."experiment_cell_values" (
    "id" uuid not null default gen_random_uuid(),
    "column_id" uuid not null,
    "row_index" integer not null,
    "value" text,
    "created_at" timestamp with time zone not null default now()
);

ALTER TABLE "public"."experiment_cell_values"
ENABLE ROW LEVEL SECURITY;

-- Create all indexes first
CREATE UNIQUE INDEX experiment_table_pkey ON public.experiment_table USING btree (id);
CREATE UNIQUE INDEX experiment_table_name_key ON public.experiment_table USING btree (name);
CREATE UNIQUE INDEX experiment_columns_pkey ON public.experiment_columns USING btree (id);
CREATE UNIQUE INDEX experiment_cell_values_pkey ON public.experiment_cell_values USING btree (id);
CREATE UNIQUE INDEX experiment_cell_values_column_row_key ON public.experiment_cell_values USING btree (column_id, row_index);

-- Then add primary key constraints using the indexes
ALTER TABLE "public"."experiment_table"
ADD CONSTRAINT "experiment_table_pkey" PRIMARY KEY USING INDEX "experiment_table_pkey";

ALTER TABLE "public"."experiment_columns"
ADD CONSTRAINT "experiment_columns_pkey" PRIMARY KEY USING INDEX "experiment_columns_pkey";

ALTER TABLE "public"."experiment_cell_values"
ADD CONSTRAINT "experiment_cell_values_pkey" PRIMARY KEY USING INDEX "experiment_cell_values_pkey";

-- Add unique constraints
ALTER TABLE "public"."experiment_table"
ADD CONSTRAINT "experiment_table_name_key" UNIQUE USING INDEX "experiment_table_name_key";

-- Add foreign key constraints with not valid first
ALTER TABLE "public"."experiment_table"
ADD CONSTRAINT "experiment_table_experiment_id_fkey"
FOREIGN KEY (experiment_id) REFERENCES experiment_v2(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;

ALTER TABLE "public"."experiment_columns"
ADD CONSTRAINT "experiment_columns_table_id_fkey"
FOREIGN KEY (table_id) REFERENCES experiment_table(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;

ALTER TABLE "public"."experiment_cell_values"
ADD CONSTRAINT "experiment_cell_values_column_id_fkey"
FOREIGN KEY (column_id) REFERENCES experiment_columns(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;

-- Then validate the constraints
ALTER TABLE "public"."experiment_table"
VALIDATE CONSTRAINT "experiment_table_experiment_id_fkey";

ALTER TABLE "public"."experiment_columns"
VALIDATE CONSTRAINT "experiment_columns_table_id_fkey";

ALTER TABLE "public"."experiment_cell_values"
VALIDATE CONSTRAINT "experiment_cell_values_column_id_fkey";
