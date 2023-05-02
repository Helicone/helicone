// Assigns a customer (Stripe customer ID) to a subscription (Stripe Subscription Price ID)
// const subscription = await stripe.subscriptions.create({
//     customer: 'cus_NLSWVUtdREqRUt',
//     items: [
//       {price: 'price_1MalDMFeVmeixR9wol3MkpmM'},
//     ],

import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { stripeServer } from "../../../../utlis/stripeServer";

//   });
type Data = {
  data: Stripe.Response<Stripe.Subscription> | null;
  error: string | null | unknown;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const body = req.body as Stripe.SubscriptionCreateParams;
  const { customer } = body;
  if (!customer) {
    res.status(400).json({ data: null, error: "Invalid request" });
    return;
  }
  try {
    const params: Stripe.SubscriptionCreateParams = {
      customer,
      items: [{ price: process.env.STRIPE_BASIC_FLEX_PRICE_ID }],
    };
    const subscription = await stripeServer.subscriptions.create(params);
    res.status(200).json({ data: subscription, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error });
  }
}
