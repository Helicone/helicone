alter table "public"."organization_member" drop constraint "organization_member_organization_fkey";

alter table "public"."organization_member" add constraint "organization_member_organization_fkey" FOREIGN KEY (organization) REFERENCES organization(id) ON DELETE CASCADE not valid;

alter table "public"."organization_member" validate constraint "organization_member_organization_fkey";

