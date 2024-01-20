create policy "org_members_can_select_finetune_dataset"
on "public"."finetune_dataset"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM organization
  WHERE (organization.id = finetune_dataset.organization_id))));


create policy "org_members_can_finetune_dataset_data"
on "public"."finetune_dataset_data"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM organization
  WHERE (organization.id = finetune_dataset_data.organization_id))));


create policy "org_members_can_select_fine_tune_job"
on "public"."finetune_job"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM organization
  WHERE (organization.id = finetune_job.organization_id))));



