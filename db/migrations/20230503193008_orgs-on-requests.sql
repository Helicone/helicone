alter table "public"."request" add column "organization_id" uuid;

alter table "public"."request" add constraint "request_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organization(id) not valid;

alter table "public"."request" validate constraint "request_organization_id_fkey";
