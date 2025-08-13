alter table "public"."job_node_relationships" drop constraint "job_node_relationships_job_fkey";

alter table "public"."job_node_relationships" drop constraint "job_node_relationships_parent_task_id_fkey";

alter table "public"."job_node_relationships" drop constraint "job_node_relationships_task_id_fkey";

alter table "public"."job_node_relationships" drop constraint "task_parents_pkey";

drop index if exists "public"."task_parents_pkey";

create table "public"."job_node_request" (
    "created_at" timestamp with time zone not null default now(),
    "request_id" uuid not null,
    "job_id" uuid not null,
    "node_id" uuid not null
);


alter table "public"."job_node_request" enable row level security;

alter table "public"."job_node" alter column "resource_data" drop not null;

alter table "public"."job_node" alter column "resource_data_type" drop not null;

alter table "public"."job_node_relationships" drop column "job";

alter table "public"."job_node_relationships" drop column "parent_task_id";

alter table "public"."job_node_relationships" drop column "task_id";

alter table "public"."job_node_relationships" add column "job_id" uuid;

alter table "public"."job_node_relationships" add column "node_id" uuid not null;

alter table "public"."job_node_relationships" add column "parent_node_id" uuid not null;

CREATE UNIQUE INDEX job_node_request_request_id ON public.job_node_request USING btree (request_id);

CREATE UNIQUE INDEX task_parents_pkey ON public.job_node_relationships USING btree (node_id, parent_node_id);

alter table "public"."job_node_relationships" add constraint "task_parents_pkey" PRIMARY KEY using index "task_parents_pkey";

alter table "public"."job_node_relationships" add constraint "job_node_relationships_job_id_fkey" FOREIGN KEY (job_id) REFERENCES job(id) not valid;

alter table "public"."job_node_relationships" validate constraint "job_node_relationships_job_id_fkey";

alter table "public"."job_node_relationships" add constraint "job_node_relationships_node_id_fkey" FOREIGN KEY (node_id) REFERENCES job_node(id) not valid;

alter table "public"."job_node_relationships" validate constraint "job_node_relationships_node_id_fkey";

alter table "public"."job_node_relationships" add constraint "job_node_relationships_parent_node_id_fkey" FOREIGN KEY (parent_node_id) REFERENCES job_node(id) not valid;

alter table "public"."job_node_relationships" validate constraint "job_node_relationships_parent_node_id_fkey";

alter table "public"."job_node_request" add constraint "job_node_request_job_id_fkey" FOREIGN KEY (job_id) REFERENCES job(id) not valid;

alter table "public"."job_node_request" validate constraint "job_node_request_job_id_fkey";

alter table "public"."job_node_request" add constraint "job_node_request_node_id_fkey" FOREIGN KEY (node_id) REFERENCES job_node(id) not valid;

alter table "public"."job_node_request" validate constraint "job_node_request_node_id_fkey";

alter table "public"."job_node_request" add constraint "job_node_request_request_id_fkey" FOREIGN KEY (request_id) REFERENCES request(id) not valid;

alter table "public"."job_node_request" validate constraint "job_node_request_request_id_fkey";


