import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { stripeServer } from "../../../../utlis/stripeServer";

type Data = {
  data: Stripe.Response<Stripe.Customer> | null;
  error: string | null | unknown;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const body = req.body as Stripe.CustomerCreateParams;
  const { email, name } = body;
  if (!email || !name) {
    res.status(400).json({ data: null, error: "Invalid request" });
    return;
  }
  try {
    const params: Stripe.CustomerCreateParams = {
      email,
      name,
      expand: ["subscriptions"],
    };
    const customer = await stripeServer.customers.create(params);
    res.status(200).json({ data: customer, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error });
  }
}
