alter table "public"."organization" add column "soft_delete" boolean not null default false;

create policy "Enable only owner can update"
on "public"."organization"
as permissive
for update
to public
using ((owner = auth.uid()))
with check ((owner = auth.uid()));



