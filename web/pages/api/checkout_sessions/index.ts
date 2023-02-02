import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";

import Stripe from "stripe";
import { getStripeCustomer } from "../../../utlis/stripeHelpers";
import { stripeServer } from "../../../utlis/stripeServer";

const MIN_AMOUNT = 50;
const MAX_AMOUNT = 50000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createServerSupabaseClient({ req, res });
  const email = (await supabase.auth.getUser())?.data.user?.email;
  if (!email) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (req.method === "POST") {
    try {
      const { data: customer, error: customerError } = await getStripeCustomer(
        email
      );
      if (customerError !== null) {
        res.status(500).json({ error: customerError });
        return;
      }

      console.log("customer", customer.subscriptions);

      if (!customer.id) {
        throw new Error("Customer not found");
      }

      const params: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ["card"],
        line_items: [
          {
            price: `price_1MWC01FeVmeixR9wL5VNBGIS`,
            quantity: 1,
          },
        ],
        mode: "subscription",
        customer: customer.id,
        success_url: `${req.headers.origin}/confirm_billing?string_session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/billing`,
      };
      const checkoutSession: Stripe.Checkout.Session =
        await stripeServer.checkout.sessions.create(params);

      res.status(200).json(checkoutSession);
    } catch (err) {
      console.log("err", err);
      const errorMessage =
        err instanceof Error ? err.message : "Internal server error";
      res.status(500).json({ statusCode: 500, message: errorMessage });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
