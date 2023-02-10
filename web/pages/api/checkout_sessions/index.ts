import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";

import Stripe from "stripe";
import { DEMO_EMAIL } from "../../../lib/constants";
import { getStripeCustomer } from "../../../utlis/stripeHelpers";
import { stripeServer } from "../../../utlis/stripeServer";

export const stripePriceId = process.env.STRIPE_PRICE_ID;
if (!stripePriceId) {
  throw new Error("Missing Stripe Price ID");
}

export const stripeStartupPriceId = process.env.STRIPE_STARTUP_PRICE_ID;
if (!stripeStartupPriceId) {
  throw new Error("Missing Stripe Price ID");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createServerSupabaseClient({ req, res });
  const email = (await supabase.auth.getUser())?.data.user?.email;

  const discountCode = req.query.discountCode as string;
  console.log("discountCode", discountCode);
  if (!email) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (email === DEMO_EMAIL) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (req.method === "POST") {
    const discounts =
      discountCode && discountCode !== "" ? [{ coupon: discountCode }] : [];
    try {
      const { data: customer, error: customerError } = await getStripeCustomer(
        email
      );
      if (customerError !== null) {
        res.status(500).json({ error: customerError });
        return;
      }

      if (!customer.id) {
        throw new Error("Customer not found");
      }

      const params: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ["card"],
        line_items: [
          {
            price: stripeStartupPriceId,
            quantity: 1,
          },
        ],
        discounts,
        mode: "subscription",
        customer: customer.id,
        success_url: `${req.headers.origin}/usage?string_session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/usage`,
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
