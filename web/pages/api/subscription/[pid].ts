import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

import { deleteSubscription } from "../../../lib/api/subscription/delete";
import { getSubscriptions } from "../../../lib/api/subscription/get";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Stripe.Subscription[] | string | Stripe.Subscription>
) {
  if (req.method === "GET") {
    const { data: subscriptions, error: subscriptionError } =
      await getSubscriptions(req, res);
    if (subscriptionError !== null) {
      console.error(subscriptionError);
      res.status(500).json(subscriptionError);
      return;
    }
    res.status(200).json(subscriptions);
  } else if (req.method === "DELETE") {
    const { data: subscription, error: subscriptionError } =
      await deleteSubscription(req, res);
    if (subscriptionError !== null) {
      console.error(subscriptionError);
      res.status(500).json(subscriptionError);
      return;
    }
    res.status(200).json(subscription);
  } else {
    console.error(`Method ${req.method} not allowed`);
    res.setHeader("Allow", "GET, DELETE");
    res.status(405).json("Method Not Allowed");
  }
}
