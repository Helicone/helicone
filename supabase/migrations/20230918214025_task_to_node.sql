alter table "public"."task" drop constraint "task_job_fkey";

alter table "public"."task" drop constraint "task_org_id_fkey";

alter table "public"."task_parents" drop constraint "task_parents_parent_task_id_fkey";

alter table "public"."task_parents" drop constraint "task_parents_task_id_fkey";

alter table "public"."request_job_task" drop constraint "request_job_task_task_id_fkey";

alter table "public"."task" drop constraint "tasks_pkey";

alter table "public"."task_parents" drop constraint "task_parents_pkey";

drop index if exists "public"."task_parents_pkey";

drop index if exists "public"."tasks_pkey";

drop table "public"."task";

drop table "public"."task_parents";

create table "public"."job_node" (
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


alter table "public"."job_node" enable row level security;

create table "public"."job_node_relationships" (
    "task_id" uuid not null,
    "parent_task_id" uuid not null,
    "job" uuid
);


alter table "public"."job_node_relationships" enable row level security;

CREATE UNIQUE INDEX task_parents_pkey ON public.job_node_relationships USING btree (task_id, parent_task_id);

CREATE UNIQUE INDEX tasks_pkey ON public.job_node USING btree (id);

alter table "public"."job_node" add constraint "tasks_pkey" PRIMARY KEY using index "tasks_pkey";

alter table "public"."job_node_relationships" add constraint "task_parents_pkey" PRIMARY KEY using index "task_parents_pkey";

alter table "public"."job_node" add constraint "job_node_job_fkey" FOREIGN KEY (job) REFERENCES job(id) not valid;

alter table "public"."job_node" validate constraint "job_node_job_fkey";

alter table "public"."job_node" add constraint "job_node_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organization(id) not valid;

alter table "public"."job_node" validate constraint "job_node_org_id_fkey";

alter table "public"."job_node_relationships" add constraint "job_node_relationships_job_fkey" FOREIGN KEY (job) REFERENCES job(id) not valid;

alter table "public"."job_node_relationships" validate constraint "job_node_relationships_job_fkey";

alter table "public"."job_node_relationships" add constraint "job_node_relationships_parent_task_id_fkey" FOREIGN KEY (parent_task_id) REFERENCES job_node(id) not valid;

alter table "public"."job_node_relationships" validate constraint "job_node_relationships_parent_task_id_fkey";

alter table "public"."job_node_relationships" add constraint "job_node_relationships_task_id_fkey" FOREIGN KEY (task_id) REFERENCES job_node(id) not valid;

alter table "public"."job_node_relationships" validate constraint "job_node_relationships_task_id_fkey";

alter table "public"."request_job_task" add constraint "request_job_task_task_id_fkey" FOREIGN KEY (task_id) REFERENCES job_node(id) not valid;

alter table "public"."request_job_task" validate constraint "request_job_task_task_id_fkey";




alter table "public"."job_node" add column "node_type" text not null default 'TASK'::text;

alter table "public"."job_node" add column "resource_data" text not null;

alter table "public"."job_node" add column "resource_data_type" text not null;


