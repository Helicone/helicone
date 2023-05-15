import { Result } from "../../../lib/result";

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getStripeCustomer } from "../../../utlis/stripeHelpers";
import { stripeServer } from "../../../utlis/stripeServer";

async function handler(option: HandlerWrapperOptions<Result<string, string>>) {
  const {
    res,
    userData: { orgId, user },
  } = option;
  if (!user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }

  const customer = await getStripeCustomer(user.email ?? "");
  if (customer.error !== null) {
    res.status(500).json({ error: customer.error, data: null });
    return;
  }
  const portal = await stripeServer.billingPortal.sessions.create({
    customer: customer.data?.id,
  });
  res.status(200).json({ error: null, data: portal.url });
}

export default withAuth(handler);
