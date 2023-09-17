create table "public"."run" (
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


alter table "public"."run" enable row level security;

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
    "parent_task" uuid,
    "run" uuid not null
);


alter table "public"."task" enable row level security;

alter table "public"."request" add column "run_id" uuid;

alter table "public"."request" add column "task_id" uuid;

CREATE UNIQUE INDEX runs_pkey ON public.run USING btree (id);

CREATE UNIQUE INDEX tasks_pkey ON public.task USING btree (id);

alter table "public"."run" add constraint "runs_pkey" PRIMARY KEY using index "runs_pkey";

alter table "public"."task" add constraint "tasks_pkey" PRIMARY KEY using index "tasks_pkey";

alter table "public"."request" add constraint "request_run_id_fkey" FOREIGN KEY (run_id) REFERENCES run(id) not valid;

alter table "public"."request" validate constraint "request_run_id_fkey";

alter table "public"."request" add constraint "request_task_id_fkey" FOREIGN KEY (task_id) REFERENCES task(id) not valid;

alter table "public"."request" validate constraint "request_task_id_fkey";

alter table "public"."run" add constraint "run_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organization(id) not valid;

alter table "public"."run" validate constraint "run_org_id_fkey";

alter table "public"."task" add constraint "task_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organization(id) not valid;

alter table "public"."task" validate constraint "task_org_id_fkey";

alter table "public"."task" add constraint "task_parent_task_fkey" FOREIGN KEY (parent_task) REFERENCES task(id) not valid;

alter table "public"."task" validate constraint "task_parent_task_fkey";

alter table "public"."task" add constraint "task_run_fkey" FOREIGN KEY (run) REFERENCES run(id) not valid;

alter table "public"."task" validate constraint "task_run_fkey";


