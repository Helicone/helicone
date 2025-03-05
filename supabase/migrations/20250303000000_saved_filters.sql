create table "public"."saved_filters" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "name" text,
    "filter" jsonb not null,
    "created_at" timestamp with time zone not null default now(),
    "last_used" timestamp with time zone not null default now(),
    "created_by" uuid,
    "is_global" boolean not null default false
);
create unique index saved_filters_pkey on public.saved_filters using btree (id);
create unique index saved_filters_org_name_idx on public.saved_filters using btree (organization_id, name)
where (name is not null);
alter table "public"."saved_filters"
add constraint "saved_filters_pkey" primary key using index "saved_filters_pkey";
alter table "public"."saved_filters"
add constraint "saved_filters_organization_id_fkey" foreign key (organization_id) references organization(id) on update cascade on delete cascade not valid;
alter table "public"."saved_filters"
add constraint "saved_filters_created_by_fkey" foreign key (created_by) references auth.users(id) on update cascade on delete
set null not valid;
alter table "public"."saved_filters" validate constraint "saved_filters_organization_id_fkey";
alter table "public"."saved_filters" validate constraint "saved_filters_created_by_fkey";