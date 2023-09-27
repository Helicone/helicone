import { Result } from "../../../lib/result";

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getStripeCustomer } from "../../../utlis/stripeHelpers";
import { stripeServer } from "../../../utlis/stripeServer";
import { supabaseServer } from "../../../lib/supabaseServer";

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
    .select("stripe_customer_id")
    .eq("id", orgId)
    .single();

  if (error !== null) {
    res.status(500).json({ error: error.message, data: null });
    return;
  }

  if (data.stripe_customer_id === null) {
    res.status(400).json({ error: "No customer ID found", data: null });
    return;
  }

  const portal = await stripeServer.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
  });
  res.status(200).json({ error: null, data: portal.url });
}

export default withAuth(handler);
