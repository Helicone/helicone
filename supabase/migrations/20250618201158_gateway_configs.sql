create table "public"."gateway_configs" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "organization_id" uuid not null,
    "key_id" bigint,
    "name" character varying
);

alter table "public"."gateway_configs" enable row level security;

revoke all on table "public"."gateway_configs" from anon, authenticated, public;

CREATE UNIQUE INDEX gateway_configs_pkey ON public.gateway_configs USING btree (id);

alter table "public"."gateway_configs" add constraint "gateway_configs_pkey" PRIMARY KEY using index "gateway_configs_pkey";

alter table "public"."gateway_configs" add constraint "public_gateway_configs_key_id_fkey" FOREIGN KEY (key_id) REFERENCES helicone_api_keys(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."gateway_configs" validate constraint "public_gateway_configs_key_id_fkey";

alter table "public"."gateway_configs" add constraint "public_gateway_configs_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organization(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."gateway_configs" validate constraint "public_gateway_configs_organization_id_fkey";

create table "public"."gateway_config_versions" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "config_id" uuid not null,
    "version" character varying not null,
    "config" jsonb not null
);

alter table "public"."gateway_config_versions" enable row level security;

revoke all on table "public"."gateway_config_versions" from anon, authenticated, public;

CREATE UNIQUE INDEX gateway_config_versions_pkey ON public.gateway_config_versions USING btree (id);

alter table "public"."gateway_config_versions" add constraint "gateway_config_versions_pkey" PRIMARY KEY using index "gateway_config_versions_pkey";

alter table "public"."gateway_config_versions" add constraint "public_gateway_config_versions_config_id_fkey" FOREIGN KEY (config_id) REFERENCES gateway_configs(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."gateway_config_versions" validate constraint "public_gateway_config_versions_config_id_fkey";
