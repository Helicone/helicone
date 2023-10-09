import { Result } from "../../../lib/result";

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getStripeCustomer } from "../../../utlis/stripeHelpers";
import { stripeServer } from "../../../utlis/stripeServer";
import { supabaseServer } from "../../../lib/supabaseServer";
import { getOwner } from "../organization/[id]/owner";

async function handler(option: HandlerWrapperOptions<Result<string, string>>) {
  const {
    res,
    userData: { orgId, user },
  } = option;
  if (!user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }

  const { data, error } = await supabaseServer
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
