import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { Result } from "../../result";
import { getStripeCustomerFromNext } from "../../../utlis/stripeHelpers";
import { stripeServer } from "../../../utlis/stripeServer";

/**
 * Deletes a subscription from Stripe.
 *
 * @param req - The NextApiRequest object.
 * @param res - The NextApiResponse object.
 * @returns A Promise that resolves to a Result object containing the deleted subscription or an error message.
 */
export async function deleteSubscription(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<Result<Stripe.Subscription, string>> {
  const { pid } = req.query;
  const subscriptionId = pid as string | undefined;

  if (!subscriptionId) {
    return { data: null, error: "No subscription id provided" };
  }

  const { data: customer, error: customerError } =
    await getStripeCustomerFromNext(req, res);
  if (customerError !== null) {
    return { data: null, error: customerError };
  }
  if (customer.subscriptions && customer.subscriptions.data.length > 0) {
    const subscription = customer.subscriptions.data.find(
      (sub) => sub.id === subscriptionId
    );
    if (!subscription) {
      return { data: null, error: "No matching subscription id" };
    } else {
      const deletedSubscription = await stripeServer.subscriptions.update(
        subscriptionId,
        {
          cancel_at_period_end: true,
        }
      );

      return { data: deletedSubscription, error: null };
    }
  } else {
    return { data: null, error: "No subscriptions found" };
  }
}
