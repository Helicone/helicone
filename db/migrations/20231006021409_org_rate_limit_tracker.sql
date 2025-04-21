create table "public"."org_rate_limit_tracker" (
    "created_at" timestamp with time zone default now(),
    "id" uuid not null default gen_random_uuid(),
    "org_id" uuid not null,
    "total_count" bigint not null default '0'::bigint
);


alter table "public"."org_rate_limit_tracker" enable row level security;

CREATE UNIQUE INDEX org_rate_limit_tracker_pkey ON public.org_rate_limit_tracker USING btree (id);

alter table "public"."org_rate_limit_tracker" add constraint "org_rate_limit_tracker_pkey" PRIMARY KEY using index "org_rate_limit_tracker_pkey";

alter table "public"."org_rate_limit_tracker" add constraint "org_rate_limit_tracker_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organization(id) not valid;

alter table "public"."org_rate_limit_tracker" validate constraint "org_rate_limit_tracker_org_id_fkey";

create UNIQUE index org_rate_limit_tracker_org_id_created_at on public.org_rate_limit_tracker using btree (org_id, created_at);
