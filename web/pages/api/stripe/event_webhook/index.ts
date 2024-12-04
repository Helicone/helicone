import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { Database } from "../../../../supabase/database.types";
import { getExperimentUsage } from "@/lib/api/stripe/experimentUsage";
import { costOf } from "@/packages/cost";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const PricingVersionOld = {
  async handleCreate(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    // subscription.metadata?.["helcionePricingVersion"] !==
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
  },

  async handleUpdate(event: Stripe.Event) {
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

    let updateFields: Database["public"]["Tables"]["organization"]["Update"] = {
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
      console.log("Organization updated successfully: ", JSON.stringify(data));
    }
  },

  async handleDelete(event: Stripe.Event) {
    // Subscription has been deleted, either due to non-payment or being manually canceled.
    const subscriptionDeleted = event.data.object as Stripe.Subscription;

    await supabaseServer
      .from("organization")
      .update({
        tier: "free",
        subscription_status: "inactive",
        stripe_metadata: {
          addons: {},
        },
      })
      .eq("stripe_subscription_id", subscriptionDeleted.id);
  },

  async handleCheckoutSessionCompleted(event: Stripe.Event) {
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
  },
};

const PricingVersion20240913 = {
  async handleCreate(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    // subscription.metadata?.["helcionePricingVersion"] !==
    const subscriptionId = subscription.id;
    const subscriptionItemId = subscription?.items.data[0].id;
    const orgId = subscription.metadata?.orgId;

    const { data, error } = await supabaseServer
      .from("organization")
      .update({
        subscription_status: "active",
        stripe_subscription_id: subscriptionId,
        stripe_subscription_item_id: subscriptionItemId, // Required for usage based pricing
        tier: "pro-20240913",
        stripe_metadata: {
          addons: {},
        },
      })
      .eq("id", orgId || "");
  },

  handleUpdate: async (event: Stripe.Event) => {
    // We don't need to do anything here because the subscription is already active
    // All update states are handled in the jawn StripeManager
    return;
  },
  handleCheckoutSessionCompleted: async (event: Stripe.Event) => {
    // We don't need to do anything here because the subscription is already active
    // All update states are handled in the jawn StripeManager
    return;
  },
  handleDelete: PricingVersionOld.handleDelete,
};

const EXPERIMENT_USAGE_COST = 2;

const InvoiceHandlers = {
  async handleInvoiceCreated(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;

    try {
      if (invoice.status === "draft") {
        const subscriptionMetadata = invoice.subscription_details?.metadata;
        const orgId = subscriptionMetadata?.orgId;
        if (!orgId) {
          console.log("No orgId found, skipping invoice item creation");
          return;
        }

        const customerID =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (!customerID) {
          console.log("No customerID found, skipping invoice item creation");
          return;
        }

        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );

        const subscriptionStartDate = new Date(
          subscription.current_period_start * 1000
        );
        const subscriptionEndDate = new Date(
          subscription.current_period_end * 1000
        );

        const experimentUsage = await getExperimentUsage(
          orgId,
          subscriptionStartDate,
          subscriptionEndDate
        );
        if (experimentUsage.error || !experimentUsage.data) {
          console.error(
            "Error getting experiment usage:",
            experimentUsage.error
          );
          return;
        }

        if (experimentUsage.data.length !== 0) {
          for (const usage of experimentUsage.data) {
            const totalCost = costOf({
              model: usage.model,
              provider: usage.provider.toUpperCase(),
            });

            if (!totalCost) {
              console.error("No cost found for", usage.model, usage.provider);
              continue;
            }

            await stripe.invoiceItems.create({
              customer: customerID,
              invoice: invoice.id,
              currency: "usd",
              amount: Math.ceil(
                totalCost.completion_token * usage.completion_tokens * 100
              ),
              description: `${usage.provider}/${
                usage.model
              }: ${usage.completion_tokens.toLocaleString()} completion tokens at $${(
                (totalCost.completion_token * 1_000_000) /
                100
              ).toFixed(2)}/million tokens`,
            });
          }
        }
      } else {
        console.log("Invoice is not draft, skipping finalization");
        console.log(invoice);
      }
    } catch (error) {
      console.error("Error handling invoice creation:", error);
      throw error;
    }
  },

  async handleInvoiceUpcoming(event: Stripe.Event) {
    console.log("Invoice upcoming");

    const invoice = event.data.object as Stripe.Invoice;

    try {
      if (invoice.subscription) {
        // await stripe.subscriptions.update(invoice.subscription as string, {
        //   metadata: {
        //     lastInvoicePreview: new Date().toISOString(),
        //   },
        // });
      }
    } catch (error) {
      console.error("Error handling upcoming invoice:", error);
      throw error;
    }
  },
};

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
    const stripeObject = event.data.object as
      | Stripe.Subscription
      | Stripe.Checkout.Session;
    const pricingFunctions =
      stripeObject.metadata?.["tier"] === "pro-20240913"
        ? PricingVersion20240913
        : PricingVersionOld;

    if (event.type === "test_helpers.test_clock.advancing") {
      return res.status(200).end();
    }

    console.log(event.type);

    const knownUnhandledEvents = [
      "invoiceitem.created",
      "invoice.updated",
      "payment_intent.succeeded",
      "charge.succeeded",
      "payment_intent.created",
      "customer.updated",
      "test_helpers.test_clock.ready",
      "invoice.payment_succeeded",
      "invoice.paid",
      "invoice.finalized",
    ];

    if (knownUnhandledEvents.includes(event.type)) {
      console.log("Unhandled event type", event.type);
      return res.status(200).end();
    }

    if (event.type === "customer.subscription.created") {
      await pricingFunctions.handleCreate(event);
    } else if (event.type === "checkout.session.completed") {
      await pricingFunctions.handleCheckoutSessionCompleted(event);
    } else if (event.type === "customer.subscription.updated") {
      await pricingFunctions.handleUpdate(event);
    } else if (event.type === "customer.subscription.deleted") {
      await pricingFunctions.handleDelete(event);
    } else if (event.type === "invoice.created") {
      await InvoiceHandlers.handleInvoiceCreated(event);
    } else if (event.type === "invoice.upcoming") {
      await InvoiceHandlers.handleInvoiceUpcoming(event);
    } else {
      console.log("Unhandled event type", event.type);
      return res.status(400).end();
    }

    res.json({ received: true });
    res.status(200).end();
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
