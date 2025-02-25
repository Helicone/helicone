import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { getSupabaseServer } from "../../../../lib/supabaseServer";
import { resultMap } from "../../../../lib/result";
import { dbExecute } from "../../../../lib/api/db/dbExecute";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  // Extract organization and user data
  const { orgId, userEmail } = req.body;

  if (!orgId) {
    return res.status(400).json({ error: "Missing organization ID." });
  }
  if (!userEmail) {
    return res.status(400).json({ error: "Missing user email." });
  }

  try {
    const { data: org, error: orgError } = resultMap(
      await dbExecute<{
        stripe_customer_id: string;
      }>("SELECT * FROM organization WHERE id = $1", [orgId]),
      (d) => d[0]
    );

    if (orgError !== null) {
      console.error(orgError);
      res.status(400).send(`Unable to find org: ${orgError}`);
      return;
    }

    let customerId = org.stripe_customer_id;

    // If the organization isn't already associated with a Stripe customer, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
      });

      customerId = customer.id;

      await getSupabaseServer()
        .from("organization")
        .update({ stripe_customer_id: customerId })
        .eq("id", orgId);
    }
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;
    const origin = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_GROWTH_PRICE_ID,
          // No quantity for usage based pricing
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard`,
      cancel_url: `${origin}/dashboard`,
      metadata: {
        orgId: orgId,
      },
      subscription_data: {
        metadata: {
          orgId: orgId,
          tier: "growth",
        },
      },
      allow_promotion_codes: true,
    });

    // Respond with the session ID
    res.status(200).json({ sessionId: session.id });
  } catch (e) {
    res.status(500).json({ error: "Failed to create checkout session." + e });
  }
}
