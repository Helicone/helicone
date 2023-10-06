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

create table "public"."org_rate_limit_tracker" (
    "created_at" timestamp with time zone default now(),
    "id" uuid not null default gen_random_uuid(),
    "org_id" uuid not null
);


alter table "public"."org_rate_limit_tracker" enable row level security;

alter table "public"."job_node" alter column "resource_data" drop not null;

alter table "public"."job_node" alter column "resource_data_type" drop not null;

alter table "public"."job_node_relationships" drop column "job";

alter table "public"."job_node_relationships" drop column "parent_task_id";

alter table "public"."job_node_relationships" drop column "task_id";

alter table "public"."job_node_relationships" add column "job_id" uuid;

alter table "public"."job_node_relationships" add column "node_id" uuid not null;

alter table "public"."job_node_relationships" add column "parent_node_id" uuid not null;

alter table "public"."organization" drop column "stripe_customer_id";

alter table "public"."organization" drop column "stripe_subscription_id";

alter table "public"."organization" drop column "subscription_status";

alter table "public"."organization" drop column "tier";

CREATE UNIQUE INDEX org_rate_limit_tracker_pkey ON public.org_rate_limit_tracker USING btree (id);

CREATE UNIQUE INDEX task_parents_pkey ON public.job_node_relationships USING btree (node_id, parent_node_id);

alter table "public"."org_rate_limit_tracker" add constraint "org_rate_limit_tracker_pkey" PRIMARY KEY using index "org_rate_limit_tracker_pkey";

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

alter table "public"."org_rate_limit_tracker" add constraint "org_rate_limit_tracker_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organization(id) not valid;

alter table "public"."org_rate_limit_tracker" validate constraint "org_rate_limit_tracker_org_id_fkey";


