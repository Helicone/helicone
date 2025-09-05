import Stripe from "stripe";
import { ok, err, Result } from "../util/results";
import { Wallet } from "../durable-objects/Wallet";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";

export class StripeManager {
  private webhookSecret: string;
  private stripeSecretKey: string;
  private wallet: DurableObjectNamespace<Wallet>;
  private stripe: Stripe;
  private env: Env;

  constructor(
    webhookSecret: string,
    stripeSecretKey: string,
    wallet: DurableObjectNamespace<Wallet>,
    env: Env
  ) {
    this.webhookSecret = webhookSecret;
    this.stripeSecretKey = stripeSecretKey;
    this.wallet = wallet;
    this.stripe = new Stripe(this.stripeSecretKey, {
      // @ts-ignore
      apiVersion: "2025-07-30.basil",
      httpClient: Stripe.createFetchHttpClient(),
    });
    this.env = env;
  }

  async verifyAndConstructEvent(
    body: string,
    signature: string
  ): Promise<Result<Stripe.Event, string>> {
    try {
      const event = await this.stripe.webhooks.constructEventAsync(
        body,
        signature,
        this.webhookSecret
      );

      return ok(event);
    } catch (e) {
      const errorMessage = `Webhook signature verification failed: ${
        e instanceof Error ? e.message : "Unknown error"
      }`;
      console.error(errorMessage);
      return err(errorMessage);
    }
  }

  async handleEvent(event: Stripe.Event): Promise<Result<void, string>> {
    try {
      console.log(`Received Stripe webhook event: ${event.type}`);

      switch (event.type) {
        case "payment_intent.succeeded":
          return await this.handlePaymentIntentSucceeded(
            event.id,
            event.data.object as Stripe.PaymentIntent
          );

        default:
          console.log(
            `Skipping processing of unknown event type: ${event.type}`
          );
          break;
      }

      return ok(undefined);
    } catch (e) {
      const errorMessage = `Error handling webhook event: ${
        e instanceof Error ? e.message : "Unknown error"
      }`;
      console.error(errorMessage);
      return err(errorMessage);
    }
  }

  private async handlePaymentIntentSucceeded(
    eventId: string,
    paymentIntent: Stripe.PaymentIntent
  ): Promise<Result<void, string>> {
    let customerId;
    if (typeof paymentIntent.customer === "string") {
      customerId = paymentIntent.customer;
    } else if (
      typeof paymentIntent.customer === "object" &&
      paymentIntent.customer !== null &&
      "id" in paymentIntent.customer
    ) {
      customerId = paymentIntent.customer.id;
    } else {
      console.debug(
        `Payment intent customer is not a string or object with id, skipping: ${paymentIntent.id}`
      );
      return err("Unable to get Stripe customer id from payment intent");
    }

    const orgId = await getOrgIdFromStripeCustomerId(this.env, customerId);
    if (!orgId) {
      return err("Unable to get org id from payment intent");
    }

    const walletId = this.wallet.idFromName(orgId);
    const walletStub = this.wallet.get(walletId);
    try {
      const isProcessed = await walletStub.isEventProcessed(eventId);
      if (isProcessed) {
        console.log(`Event ${eventId} has already been processed, skipping`);
        return ok(undefined);
      }
    } catch (e) {
      const errorMessage = `Failed to check if event ${eventId} has been processed: ${e instanceof Error ? e.message : "Unknown error"}`;
      console.error(errorMessage);
      return err(errorMessage);
    }

    if (!paymentIntent.metadata.productId) {
      return ok(undefined);
    } else if (paymentIntent.currency.toUpperCase() !== "USD") {
      return ok(undefined);
    } else if (
      paymentIntent.metadata.productId ===
      this.env.STRIPE_CLOUD_GATEWAY_TOKEN_USAGE_PRODUCT
    ) {
      return this.handleTokenUsagePaymentSucceeded(
        eventId,
        paymentIntent,
        walletStub,
        orgId
      );
    } else {
      return ok(undefined);
    }
  }

  private async handleTokenUsagePaymentSucceeded(
    eventId: string,
    paymentIntent: Stripe.PaymentIntent,
    walletStub: DurableObjectStub<Wallet>,
    orgId: string
  ): Promise<Result<void, string>> {
    const amount = paymentIntent.amount_received;
    try {
      await walletStub.addCredits(amount, eventId);
      console.log(
        `Added ${amount} to wallet for org ${orgId} for payment intent ${paymentIntent.id} event ${eventId}`
      );
      return ok(undefined);
    } catch (e) {
      const errorMessage = `Failed to process payment intent ${paymentIntent.id} for org ${orgId} with amount ${amount}: ${e instanceof Error ? e.message : "Unknown error"}`;
      console.error(errorMessage);
      return err(errorMessage);
    }
  }
}

async function getOrgIdFromStripeCustomerId(
  env: Env,
  stripeCustomerId: string
): Promise<string | null> {
  const supabaseClientUs = createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // stripe webhook could originate from any region,
  // and might not be related to where the user's org is located
  // so we just try to get their org id from the stripe customer id
  // from either region

  try {
    const orgId = await supabaseClientUs
      .from("organization")
      .select("id")
      .eq("stripe_customer_id", stripeCustomerId)
      .eq("soft_delete", false)
      .single();

    if (orgId.data?.id) {
      return orgId.data?.id;
    }
  } catch (e) {
    console.log(
      "could not get org id from stripe customer id from us region, trying eu region"
    );
  }

  const supabaseClientEu = createClient<Database>(
    env.EU_SUPABASE_URL,
    env.EU_SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const orgId = await supabaseClientEu
      .from("organization")
      .select("id")
      .eq("stripe_customer_id", stripeCustomerId)
      .eq("soft_delete", false)
      .single();

    if (orgId.data?.id) {
      return orgId.data?.id;
    }
  } catch (e) {
    console.log(
      "could not get org id from stripe customer id from eu region, skipping"
    );
  }
  return null;
}
