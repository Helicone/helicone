
-- Then create the tables
CREATE TABLE "public"."experiment_table" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "experiment_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
);

ALTER TABLE "public"."experiment_table"
ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."experiment_column" (
    "id" uuid not null default gen_random_uuid(),
    "table_id" uuid not null,
    "column_name" text not null,
    "column_type" text not null,
    "created_at" timestamp with time zone not null default now()
);

ALTER TABLE "public"."experiment_column"
ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."experiment_cell_value" (
    "id" uuid not null default gen_random_uuid(),
    "column_id" uuid not null,
    "row_index" integer not null,
    "value" text,
    "created_at" timestamp with time zone not null default now()
);

ALTER TABLE "public"."experiment_cell_value"
ENABLE ROW LEVEL SECURITY;

-- Create all indexes first
CREATE UNIQUE INDEX experiment_table_pkey ON public.experiment_table USING btree (id);
CREATE UNIQUE INDEX experiment_column_pkey ON public.experiment_column USING btree (id);
CREATE UNIQUE INDEX experiment_cell_value_pkey ON public.experiment_cell_value USING btree (id);
CREATE UNIQUE INDEX experiment_cell_value_column_row_key ON public.experiment_cell_value USING btree (column_id, row_index);

-- Then add primary key constraints using the indexes
ALTER TABLE "public"."experiment_table"
ADD CONSTRAINT "experiment_table_pkey" PRIMARY KEY USING INDEX "experiment_table_pkey";

ALTER TABLE "public"."experiment_column"
ADD CONSTRAINT "experiment_column_pkey" PRIMARY KEY USING INDEX "experiment_column_pkey";

ALTER TABLE "public"."experiment_cell_value"
ADD CONSTRAINT "experiment_cell_value_pkey" PRIMARY KEY USING INDEX "experiment_cell_value_pkey";

-- Add unique constraints
ALTER TABLE "public"."experiment_table"
ADD CONSTRAINT "experiment_table_name_key" UNIQUE USING INDEX "experiment_table_name_key";

-- Add foreign key constraints with not valid first
ALTER TABLE "public"."experiment_table"
ADD CONSTRAINT "experiment_table_experiment_id_fkey"
FOREIGN KEY (experiment_id) REFERENCES experiment_v2(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;

ALTER TABLE "public"."experiment_column"
ADD CONSTRAINT "experiment_column_table_id_fkey"
FOREIGN KEY (table_id) REFERENCES experiment_table(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;

ALTER TABLE "public"."experiment_cell_value"
ADD CONSTRAINT "experiment_cell_value_column_id_fkey"
FOREIGN KEY (column_id) REFERENCES experiment_column(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;

-- Then validate the constraints
ALTER TABLE "public"."experiment_table"
VALIDATE CONSTRAINT "experiment_table_experiment_id_fkey";

ALTER TABLE "public"."experiment_column"
VALIDATE CONSTRAINT "experiment_column_table_id_fkey";

ALTER TABLE "public"."experiment_cell_value"
VALIDATE CONSTRAINT "experiment_cell_value_column_id_fkey";
