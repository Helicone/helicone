create table "public"."asset" (
    "id" uuid not null default gen_random_uuid(),
    "request_id" uuid not null,
    "organization_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
);

alter table "public"."asset" enable row level security;

create unique index asset_pkey on public.asset using btree (id, request_id);

alter table "public"."asset" add constraint "asset_layout_pkey" primary key using index "asset_pkey";

alter table "public"."asset" add constraint "asset_request_id_fkey" foreign key (request_id) references request(id) on update cascade on delete cascade not valid;

alter table "public"."asset" add constraint "asset_organization_id_fkey" foreign key (organization_id) references organization(id) on update cascade on delete cascade not valid;

alter table "public"."asset" validate constraint "asset_request_id_fkey";

alter table "public"."asset" validate constraint "asset_organization_id_fkey";