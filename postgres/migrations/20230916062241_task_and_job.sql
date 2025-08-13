create table "public"."job" (
    "id" uuid not null,
    "org_id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
    "status" text not null default 'pending'::text,
    "name" text not null,
    "description" text not null,
    "timeout_seconds" integer not null default 60,
    "custom_properties" jsonb not null
);


alter table "public"."job" enable row level security;

create table "public"."task" (
    "id" uuid not null,
    "org_id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone not null,
    "status" text not null default 'pending'::text,
    "name" text not null default ''::text,
    "description" text not null default ''::text,
    "timeout_seconds" integer not null default 60,
    "custom_properties" jsonb not null,
    "job" uuid not null
);

CREATE TABLE "public"."task_parents" (
    "task_id" uuid NOT NULL,
    "parent_task_id" uuid NOT NULL,
    PRIMARY KEY ("task_id", "parent_task_id")
);

CREATE TABLE "public"."request_job_task" (
    "request_id" uuid NOT NULL,
    "job_id" uuid NOT NULL,
    "task_id" uuid NOT NULL,
    PRIMARY KEY ("request_id", "job_id", "task_id")
);


CREATE UNIQUE INDEX jobs_pkey ON public.job USING btree (id);

CREATE UNIQUE INDEX tasks_pkey ON public.task USING btree (id);

alter table "public"."job" add constraint "jobs_pkey" PRIMARY KEY using index "jobs_pkey";

alter table "public"."task" add constraint "tasks_pkey" PRIMARY KEY using index "tasks_pkey";

alter table "public"."job" add constraint "job_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organization(id) not valid;

alter table "public"."job" validate constraint "job_org_id_fkey";

alter table "public"."task" add constraint "task_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organization(id) not valid;

alter table "public"."task" validate constraint "task_org_id_fkey";

alter table "public"."task" add constraint "task_job_fkey" FOREIGN KEY (job) REFERENCES job(id) not valid;

alter table "public"."task" validate constraint "task_job_fkey";

ALTER TABLE "public"."task_parents" ADD CONSTRAINT "task_parents_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES task(id) NOT VALID;

ALTER TABLE "public"."task_parents" VALIDATE CONSTRAINT "task_parents_task_id_fkey";

ALTER TABLE "public"."task_parents" ADD CONSTRAINT "task_parents_parent_task_id_fkey" FOREIGN KEY ("parent_task_id") REFERENCES task(id) NOT VALID;

ALTER TABLE "public"."task_parents" VALIDATE CONSTRAINT "task_parents_parent_task_id_fkey";

ALTER TABLE "public"."request_job_task" 
ADD CONSTRAINT "request_job_task_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES request(id) NOT VALID;

ALTER TABLE "public"."request_job_task" VALIDATE CONSTRAINT "request_job_task_request_id_fkey";

ALTER TABLE "public"."request_job_task" 
ADD CONSTRAINT "request_job_task_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES task(id) NOT VALID;

ALTER TABLE "public"."request_job_task" VALIDATE CONSTRAINT "request_job_task_task_id_fkey";

ALTER TABLE "public"."request_job_task"
ADD CONSTRAINT "request_job_task_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES job(id) NOT VALID;

alter table "public"."task" enable row level security;

ALTER TABLE "public"."request_job_task" VALIDATE CONSTRAINT "request_job_task_job_id_fkey";

alter table "public"."task_parents" enable row level security;

alter table "public"."request_job_task" enable row level security;

REVOKE ALL PRIVILEGES ON TABLE public.job FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.job FROM authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.task FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.task FROM authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.task_parents FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.task_parents FROM authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.request_job_task FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.request_job_task FROM authenticated;
