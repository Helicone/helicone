import { Database } from "./../../../../../supabase/database.types";
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";
import { IncomingMessage } from "http";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { dbExecute } from "../../../../lib/api/db/dbExecute";
import { resultMap } from "../../../../lib/result";

// This is necessary to handle Stripe webhook event types
interface StripeWebhookEvent extends Stripe.Event {
  data: {
    object: Stripe.Subscription;
  };
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"]!;

    let event: StripeWebhookEvent;

    try {
      event = stripe.webhooks.constructEvent(
        buf.toString(),
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      ) as StripeWebhookEvent;
    } catch (err) {
      console.log(`❌ Error message: ${err}`);
      res.status(400).send(`Webhook Error: ${err}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        // The user has completed the checkout process and has been charged.
        const session = event.data.object;

        // Assuming you passed the organization's ID in the `metadata` when creating the checkout session:
        const orgId = session.metadata.orgId;

        await supabaseServer
          .from("organizations")
          .update({
            subscription_status: "active",
            stripe_subscription_id: session.id, // this is the ID of the subscription created by the checkout
            subscription_type: "pro",
          })
          .eq("id", orgId);
        break;

      case "customer.subscription.updated":
        // Subscription details, like billing details or status, have changed.
        const subscriptionUpdated = event.data.object;

        // check to see if the sub is active
        let active = false;
        if (subscriptionUpdated.items.data.length > 0) {
          active = subscriptionUpdated.items.data[0].plan.active;
        }

        await supabaseServer
          .from("organizations")
          .update({ tier: active ? "pro" : "free" })
          .eq("stripe_subscription_id", subscriptionUpdated.id);

        // Update the organization's status based on Stripe's subscription status.
        await supabaseServer
          .from("organizations")
          .update({ subscription_status: subscriptionUpdated.status })
          .eq("stripe_subscription_id", subscriptionUpdated.id);
        break;

      case "customer.subscription.deleted":
        // Subscription has been deleted, either due to non-payment or being manually canceled.
        const subscriptionDeleted = event.data.object;

        // Set the organization's status to 'inactive' or a similar status to indicate the subscription has ended.
        await supabaseServer
          .from("organizations")
          .update({ subscription_status: "inactive" })
          .eq("stripe_subscription_id", subscriptionDeleted.id);
        break;

      default:
        // Unexpected event type
        return res.status(400).end();
    }

    // if (
    //   event.type === "customer.subscription.updated" ||
    //   event.type === "customer.subscription.created"
    // ) {
    //   const subscription = event.data.object;

    //   // Fetch the customer
    //   const customer = await stripe.customers.retrieve(
    //     subscription.customer as string
    //   );

    //   // Now you have the customer's email address
    //   const castedCustomer = customer as any;
    //   const email = castedCustomer.email ? castedCustomer.email : null;

    //   // get the user id
    //   const { data: idData, error: idError } = resultMap(
    //     await dbExecute<{
    //       id: string;
    //     }>("SELECT id FROM auth.users WHERE email = $1", [email]),
    //     (d) => d[0].id
    //   );

    //   if (idError !== null) {
    //     console.error(idError);
    //     res.status(400).send(`Unable to find user: ${idError}`);
    //     return;
    //   }

    //   // check to see if the sub is active
    //   let active = false;
    //   if (subscription.items.data.length > 0) {
    //     active = subscription.items.data[0].plan.active;
    //   }

    //   // make the update
    //   const { error: userSettingsError } = await supabaseServer
    //     .from("user_settings")
    //     .update({
    //       tier: active ? "pro" : "free",
    //     })
    //     .eq("user", idData);

    //   if (userSettingsError) {
    //     console.error(userSettingsError);
    //     res.status(400).send(`Unable to update user settings: ${idError}`);
    //     return;
    //   }
    // }

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
