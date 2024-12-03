create table "public"."evaluator_experiments_v3" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "experiment" uuid not null,
    "evaluator" uuid not null
);
REVOKE ALL ON TABLE "public"."evaluator_experiments_v3" FROM anon;
REVOKE ALL ON TABLE "public"."evaluator_experiments_v3" FROM authenticated;

alter table "public"."evaluator_experiments_v3" enable row level security;

CREATE UNIQUE INDEX evaluator_experiments_v3_pkey ON public.evaluator_experiments_v3 USING btree (id);

alter table "public"."evaluator_experiments_v3" add constraint "evaluator_experiments_v3_pkey" PRIMARY KEY using index "evaluator_experiments_v3_pkey";

alter table "public"."evaluator_experiments_v3" add constraint "public_evaluator_experiments_v3_evaluator_fkey" FOREIGN KEY (evaluator) REFERENCES evaluator(id) not valid;

alter table "public"."evaluator_experiments_v3" validate constraint "public_evaluator_experiments_v3_evaluator_fkey";

alter table "public"."evaluator_experiments_v3" add constraint "public_evaluator_experiments_v3_experiment_fkey" FOREIGN KEY (experiment) REFERENCES experiment_v3(id) not valid;

alter table "public"."evaluator_experiments_v3" validate constraint "public_evaluator_experiments_v3_experiment_fkey";

