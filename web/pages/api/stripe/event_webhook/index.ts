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

    console.log("✅ Success:", event.id);

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.created"
    ) {
      const subscription = event.data.object;

      console.log("subscription", subscription);

      // Fetch the customer
      const customer = await stripe.customers.retrieve(
        subscription.customer as string
      );

      console.log("customer", customer);

      // Now you have the customer's email address
      const castedCustomer = customer as any;
      const email = castedCustomer.email ? castedCustomer.email : null;

      console.log("email", email);

      // get the user id
      const { data: idData, error: idError } = resultMap(
        await dbExecute<{
          id: string;
        }>("SELECT id FROM auth.users WHERE email = $1", [email]),
        (d) => d[0].id
      );

      if (idError !== null) {
        console.error(idError);
        res.status(400).send(`Unable to find user: ${idError}`);
        return;
      }

      // check to see if the sub is active
      let active = false;
      if (subscription.items.data.length > 0) {
        active = subscription.items.data[0].plan.active;
      }

      // make the update
      const { error: userSettingsError } = await supabaseServer
        .from("user_settings")
        .update({
          tier: active ? "pro" : "free",
        })
        .eq("user", idData);

      if (userSettingsError) {
        console.error(userSettingsError);
        res.status(400).send(`Unable to update user settings: ${idError}`);
        return;
      }
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
