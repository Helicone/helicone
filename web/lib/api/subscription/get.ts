import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { Result } from "../../../lib/result";
import { getStripeCustomerFromNext } from "../../../utils/stripeHelpers";

export async function getSubscriptions(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<Result<Stripe.Subscription[], string>> {
  const { data: customer, error: customerError } =
    await getStripeCustomerFromNext(req, res);
  if (customerError !== null) {
    return { data: null, error: customerError };
  }
  if (customer.subscriptions) {
    return { data: customer.subscriptions.data, error: null };
  } else {
    return { data: null, error: "no subscriptions returned in query" };
  }
}
