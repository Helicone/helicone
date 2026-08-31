import Stripe from "stripe";
import { dbExecute } from "../../../../lib/api/db/dbExecute";
import { resultMap } from "@/packages/common/result";
import { logger } from "@/lib/telemetry/logger";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../../lib/api/handlerWrappers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

async function handler({
  req,
  res,
  userData,
}: HandlerWrapperOptions<{ sessionId: string } | { error: string }>) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  // Bind to the authenticated session's org and user. Never trust an orgId
  // or email supplied in the request body.
  const orgId = userData.orgId;
  const userEmail = userData.user.email;

  if (!orgId || !userEmail) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { data: org, error: orgError } = resultMap(
      await dbExecute<{
        stripe_customer_id: string;
      }>("SELECT stripe_customer_id FROM organization WHERE id = $1", [orgId]),
      (d) => d?.[0],
    );

    if (orgError !== null) {
      logger.error({ error: orgError }, "Unable to find org");
      res.status(400).json({ error: "Unable to find org" });
      return;
    }

    let customerId = org?.stripe_customer_id;

    // If the organization isn't already associated with a Stripe customer, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
      });

      customerId = customer.id;

      const { error: updateError } = await dbExecute(
        "UPDATE organization SET stripe_customer_id = $1 WHERE id = $2",
        [customerId, orgId],
      );

      if (updateError !== null) {
        logger.error({ error: updateError }, "Unable to update org");
        res.status(400).json({ error: "Unable to update org" });
        return;
      }
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
    logger.error({ error: e }, "Failed to create checkout session");
    res.status(500).json({ error: "Failed to create checkout session." });
  }
}

export default withAuth(handler);
