create policy "Enable insert for authenticated users only"
on "public"."org_rate_limit_tracker"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT organization.id,
    organization.created_at,
    organization.name,
    organization.owner,
    organization.is_personal,
    organization.soft_delete,
    organization.color,
    organization.icon,
    organization.has_onboarded,
    organization.stripe_customer_id,
    organization.stripe_subscription_id,
    organization.subscription_status,
    organization.tier
   FROM organization
  WHERE (organization.id = org_rate_limit_tracker.org_id))));



