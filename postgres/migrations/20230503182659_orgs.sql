create table "public"."organization" (
    "id" uuid not null default uuid_generate_v4(),
    "created_at" timestamp with time zone default now(),
    "name" text not null,
    "owner" uuid not null,
    "is_personal" boolean not null default false
);


alter table "public"."organization" enable row level security;

create table "public"."organization_member" (
    "created_at" timestamp with time zone default now(),
    "member" uuid not null,
    "organization" uuid not null
);


alter table "public"."organization_member" enable row level security;

alter table "public"."helicone_api_keys" add column "organization_id" uuid;

alter table "public"."request" add column "helicone_org_id" uuid;

CREATE UNIQUE INDEX organization_member_pkey ON public.organization_member USING btree (member, organization);

CREATE UNIQUE INDEX organization_pkey ON public.organization USING btree (id);

alter table "public"."organization" add constraint "organization_pkey" PRIMARY KEY using index "organization_pkey";

alter table "public"."organization_member" add constraint "organization_member_pkey" PRIMARY KEY using index "organization_member_pkey";

alter table "public"."helicone_api_keys" add constraint "helicone_api_keys_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organization(id) not valid;

alter table "public"."helicone_api_keys" validate constraint "helicone_api_keys_organization_id_fkey";

alter table "public"."organization" add constraint "organization_owner_fkey" FOREIGN KEY (owner) REFERENCES auth.users(id) not valid;

alter table "public"."organization" validate constraint "organization_owner_fkey";

alter table "public"."organization_member" add constraint "organization_member_member_fkey" FOREIGN KEY (member) REFERENCES auth.users(id) not valid;

alter table "public"."organization_member" validate constraint "organization_member_member_fkey";

alter table "public"."organization_member" add constraint "organization_member_organization_fkey" FOREIGN KEY (organization) REFERENCES organization(id) not valid;

alter table "public"."organization_member" validate constraint "organization_member_organization_fkey";

alter table "public"."request" add constraint "request_helicone_org_id_fkey" FOREIGN KEY (helicone_org_id) REFERENCES organization(id) not valid;

alter table "public"."request" validate constraint "request_helicone_org_id_fkey";

create policy "Enable delete for owner"
on "public"."organization"
as permissive
for delete
to public
using ((owner = auth.uid()));


create policy "Enable insert for owner"
on "public"."organization"
as permissive
for insert
to public
with check ((owner = auth.uid()));


create policy "Enable read access for all users"
on "public"."organization"
as permissive
for select
to public
using (((EXISTS ( SELECT om.created_at,
    om.member,
    om.organization
   FROM organization_member om
  WHERE ((om.organization = organization.id) AND (om.member = auth.uid())))) OR (owner = auth.uid())));


create policy "Enable read access for all users"
on "public"."organization_member"
as permissive
for select
to public
using ((member = auth.uid()));



