import { NextApiRequest, NextApiResponse } from "next";

import Stripe from "stripe";
import { DEMO_EMAIL } from "../../../lib/constants";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";
import { getStripeCustomer } from "../../../utils/stripeHelpers";
import { stripeServer } from "../../../utils/stripeServer";

export const stripeStarterPriceId = process.env.STRIPE_STARTER_PRICE_ID;
if (!stripeStarterPriceId) {
  throw new Error("Missing Stripe Price ID");
}

export const stripeStarterProductId = process.env.STRIPE_STARTER_PRODUCT_ID;

if (!stripeStarterProductId) {
  throw new Error("Missing Stripe Starter Product ID");
}

export const stripeEnterpriseProductId =
  process.env.STRIPE_ENTERPRISE_PRODUCT_ID;

if (!stripeEnterpriseProductId) {
  throw new Error("Missing Stripe Enterprise Product ID");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = new SupabaseServerWrapper({ req, res }).getClient();
  const email = (await supabase.auth.getUser())?.data.user?.email;

  const discountCode = req.query.discountCode as string;

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
            price: stripeStarterPriceId,
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
      const errorMessage =
        err instanceof Error ? err.message : "Internal server error";
      res.status(500).json({ statusCode: 500, message: errorMessage });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
