alter table "public"."finetune_dataset" add column "filter_node" text;

create policy "members_can_insert_finetune_dataset"
on "public"."finetune_dataset"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM organization
  WHERE (organization.id = finetune_dataset.organization_id))));



