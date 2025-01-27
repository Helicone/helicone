import { Result } from "../../../lib/result";

import { dbExecute } from "../../../lib/api/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getSupabaseServer } from "../../../lib/supabaseServer";
import { getStripeCustomer } from "../../../utils/stripeHelpers";
import { stripeServer } from "../../../utils/stripeServer";

async function getOwner(orgId: String, userId: string) {
  const query = `
  select 
    us.tier as tier,
    email
    from organization o 
    left join auth.users u on u.id = o.owner
    left join user_settings us on us.user = u.id
    where o.id = $1 AND (
      -- Auth check
      EXISTS (
        select * from organization_member om
        left join organization o on o.id = om.organization
        where om.organization = $1 and (
          o.owner = $2 or om.member = $2
        )
      )
      OR o.owner = $2
    )
`;

  return await dbExecute<{
    email: string;
    tier: string;
  }>(query, [orgId, userId]);
}

async function handler(option: HandlerWrapperOptions<Result<string, string>>) {
  const {
    res,
    userData: { orgId, user },
  } = option;
  if (!user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }

  const { data, error } = await getSupabaseServer()
    .from("organization")
    .select("stripe_customer_id, subscription_status")
    .eq("id", orgId)
    .single();

  if (error !== null) {
    res.status(500).json({ error: error.message, data: null });
    return;
  }

  let customer_id = data.stripe_customer_id;

  if (data.subscription_status === "legacy") {
    const orgOwner = await getOwner(orgId, user.id);
    const customer = await getStripeCustomer(orgOwner.data?.[0].email ?? "");
    customer_id = customer.data?.id ?? "";
  }

  if (customer_id) {
    const portal = await stripeServer.billingPortal.sessions.create({
      customer: customer_id,
    });

    res.status(200).json({ error: null, data: portal.url });
    return;
  }

  res.status(500).json({ error: "No customer found", data: null });
}

export default withAuth(handler);
