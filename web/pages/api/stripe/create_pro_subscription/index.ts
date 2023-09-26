// /api/start-subscription.js

import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { supabaseServer } from "../../../../lib/supabaseServer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  // Extract organization and user data (you might pass user email or other identifiers)
  const { orgId, userEmail } = req.body;

  if (!orgId) {
    return res.status(400).json({ error: "Missing organization ID." });
  }
  if (!userEmail) {
    return res.status(400).json({ error: "Missing user email." });
  }

  try {
    // Fetch organization from Supabase
    const { data: org } = await supabaseServer
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single();

    let customerId = org.stripe_customer_id;

    // If the organization isn't already associated with a Stripe customer, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
      });

      customerId = customer.id;

      // Save the Stripe customer ID in Supabase
      await supabaseServer
        .from("organizations")
        .update({ stripe_customer_id: customerId })
        .eq("id", orgId);
    }

    // Create a subscription for the customer
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: process.env.STRIPE_PRO_PRICE_ID }],
    });

    // Save subscription details in Supabase
    await supabaseServer
      .from("organizations")
      .update({
        stripe_subscription_id: subscription.id,
        subscription_status: "active",
        subscription_type: "pro",
      })
      .eq("id", orgId);

    // Respond with a success message or any other relevant data
    res.status(200).json({ success: true, subscriptionId: subscription.id });
  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json({ error: "Failed to create subscription." });
  }
}
