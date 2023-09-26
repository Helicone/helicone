import { Database } from "./../../../../../supabase/database.types";
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";

import { supabaseServer } from "../../../../lib/supabaseServer";

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
      console.log(`❌ Error message: ${err}`);
      res.status(400).send(`Webhook Error: ${err}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        // The user has completed the checkout process and has been charged.

        const checkoutCompleted = event.data.object as Stripe.Checkout.Session;

        const session = await stripe.checkout.sessions.retrieve(
          checkoutCompleted.id
        );

        // Assuming you passed the organization's ID in the `metadata` when creating the checkout session:
        const orgId = session.metadata?.orgId;

        const { data, error } = await supabaseServer
          .from("organization")
          .update({
            subscription_status: "active",
            stripe_subscription_id: checkoutCompleted.subscription?.toString(), // this is the ID of the subscription created by the checkout
            tier: "pro",
          })
          .eq("id", orgId);

        break;

      case "customer.subscription.updated":
        // Subscription details, like billing details or status, have changed.
        const subscriptionUpdated = event.data.object as Stripe.Subscription;

        // check to see if the sub is active
        let status = false;

        // TODO: double check to see if this is the best way to do things
        if (subscriptionUpdated.cancel_at === null) {
          status = true;
        }

        // Update the organization's status based on Stripe's subscription status.
        await supabaseServer
          .from("organization")
          .update({ subscription_status: status ? "active" : "pending-cancel" })
          .eq("stripe_subscription_id", subscriptionUpdated.id);
        break;

      case "customer.subscription.deleted":
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
        break;

      default:
        // Unexpected event type
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
