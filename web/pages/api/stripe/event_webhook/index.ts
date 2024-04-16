import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { Database } from "../../../../supabase/database.types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"]!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        buf.toString(),
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      ) as Stripe.Event;
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err}`);
      return;
    }

    if (event.type === "customer.subscription.created") {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;
      const subscriptionItemId = subscription?.items.data[0].id;
      const orgId = subscription.metadata?.orgId;

      const { data, error } = await supabaseServer
        .from("organization")
        .update({
          subscription_status: "active",
          stripe_subscription_id: subscriptionId,
          stripe_subscription_item_id: subscriptionItemId, // Required for usage based pricing
          tier: "growth",
        })
        .eq("id", orgId || "");
    } else if (event.type === "checkout.session.completed") {
      const checkoutCompleted = event.data.object as Stripe.Checkout.Session;
      const orgId = checkoutCompleted.metadata?.orgId;
      const tier = checkoutCompleted.metadata?.tier;

      const { data, error } = await supabaseServer
        .from("organization")
        .update({
          subscription_status: "active",
          stripe_subscription_id: checkoutCompleted.subscription?.toString(), // this is the ID of the subscription created by the checkout
          tier: tier,
        })
        .eq("id", orgId || "");
    } else if (event.type === "customer.subscription.updated") {
      const subscriptionUpdated = event.data.object as Stripe.Subscription;

      const isSubscriptionActive = subscriptionUpdated.status === "active";
      let growthPlanItem = null;
      let proPlanItem = null;
      for (const item of subscriptionUpdated?.items?.data) {
        if (
          item.plan.id === process.env.STRIPE_GROWTH_PRICE_ID &&
          item.plan.usage_type === "metered"
        ) {
          growthPlanItem = item;
          break;
        } else if (
          item.plan.id === process.env.STRIPE_PRICE_ID &&
          item.plan.usage_type !== "metered"
        ) {
          proPlanItem = item;
          break;
        }
      }

      let updateFields: Database["public"]["Tables"]["organization"]["Update"] =
        {
          subscription_status: isSubscriptionActive ? "active" : "inactive",
        };

      if (isSubscriptionActive && growthPlanItem && !proPlanItem) {
        updateFields.tier = "growth";
        updateFields.stripe_subscription_item_id = growthPlanItem.id;
      } else if (isSubscriptionActive && proPlanItem && !growthPlanItem) {
        updateFields.tier = "pro";
      }

      const { data, error } = await supabaseServer
        .from("organization")
        .update(updateFields)
        .eq("stripe_customer_id", subscriptionUpdated.customer);

      if (error) {
        console.error("Failed to update organization:", JSON.stringify(error));
      } else {
        console.log(
          "Organization updated successfully: ",
          JSON.stringify(data)
        );
      }
    } else if (event.type === "customer.subscription.deleted") {
      // Subscription has been deleted, either due to non-payment or being manually canceled.
      const subscriptionDeleted = event.data.object as Stripe.Subscription;

      await supabaseServer
        .from("organization")
        .update({ tier: "free" })
        .eq("stripe_subscription_id", subscriptionDeleted.id);

      // Set the organization's status to 'inactive' or a similar status to indicate the subscription has ended.
      await supabaseServer
        .from("organization")
        .update({ subscription_status: "inactive" })
        .eq("stripe_subscription_id", subscriptionDeleted.id);
    } else {
      return res.status(400).end();
    }

    res.json({ received: true });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
