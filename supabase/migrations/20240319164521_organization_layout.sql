create table "public"."organization_layout" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "type" text not null,
    "filters" jsonb not null,
    "page_settings" jsonb not null,
    "created_at" timestamp with time zone not null default now()
);

alter table "public"."organization_layout" enable row level security;

CREATE UNIQUE INDEX organization_layout_pkey ON public.organization_layout USING btree (organization_id, id);

alter table "public"."organization_layout" add constraint "organization_layout_pkey" primary key using index "organization_layout_pkey";

alter table "public"."organization_layout" add constraint "organization_layout_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organization(id) on update cascade on delete cascade not valid;

alter table "public"."organization_layout" validate constraint "organization_layout_organization_id_fkey";