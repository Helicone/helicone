import { Database } from "./../../../../../supabase/database.types";
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";
import { IncomingMessage } from "http";
import { supabaseServer } from "../../../../lib/supabaseServer";

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

    if (event.type === "customer.subscription.created") {
      const subscription = event.data.object as any;
      console.log("Subscription Created", subscription);
      console.log("Plan", subscription.plan.id);
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;

      // Fetch the customer
      const customer = await stripe.customers.retrieve(
        subscription.customer as string
      );

      // Now you have the customer's email address
      const castedCustomer = customer as any;
      const email = castedCustomer.email ? castedCustomer.email : null;

      // Add your own business logic here.
      console.log(`Subscription for ${customer.object} has been updated.`);
      console.log("Email", email);

      // get the user id from supabase by email
      const { data, error } = await supabaseServer
        .from("user_settings")
        .update({
          tier: "pro",
        })
        // .select("*")
        .eq("email", "scott+test7@helicone.ai");

      if (error) {
        console.log("Error", error);
        return;
      }

      console.log("User", data);
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
