import Stripe from "stripe";
import { ok, err, Result } from "../util/results";
import { Wallet } from "../durable-objects/Wallet";
import { createClient } from "@supabase/supabase-js";
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

  private parseMetadataInt(value?: string | null): number | null {
    if (value === undefined || value === null) {
      return null;
    }

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      return null;
    }

    return parsed;
  }

  private getPaymentIntentBreakdown(paymentIntent: Stripe.PaymentIntent) {
    const creditsFromMetadata = this.parseMetadataInt(
      paymentIntent.metadata?.creditsAmountCents
    );
    const feeFromMetadata = this.parseMetadataInt(
      paymentIntent.metadata?.stripeFeeCents
    );
    const totalFromMetadata = this.parseMetadataInt(
      paymentIntent.metadata?.totalAmountCents
    );

    const fallbackTotal =
      typeof paymentIntent.amount === "number"
        ? paymentIntent.amount
        : typeof paymentIntent.amount_received === "number"
          ? paymentIntent.amount_received
          : 0;

    const hasBreakdownMetadata =
      creditsFromMetadata !== null ||
      feeFromMetadata !== null ||
      totalFromMetadata !== null;

    const totalCents = totalFromMetadata ?? fallbackTotal;
    const creditsCents = hasBreakdownMetadata
      ? Math.max(
          creditsFromMetadata ?? totalCents - Math.max(feeFromMetadata ?? 0, 0),
          0
        )
      : totalCents;
    const feeCents = hasBreakdownMetadata
      ? Math.max(feeFromMetadata ?? totalCents - creditsCents, 0)
      : 0;

    return {
      creditsCents,
      feeCents,
      totalCents,
    };
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
        case "refund.created":
          return await this.handleRefundCreated(
            event.id,
            event.data.object as Stripe.Refund
          );
        case "charge.dispute.created":
          return await this.handleDisputeCreated(
            event.id,
            event.data.object as Stripe.Dispute
          );
        case "charge.dispute.updated":
          return await this.handleDisputeUpdated(
            event.id,
            event.data.object as Stripe.Dispute
          );
        case "charge.dispute.closed":
          return await this.handleDisputeUpdated(
            event.id,
            event.data.object as Stripe.Dispute
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

    const processedCheck = await this.checkEventProcessed(walletStub, eventId);
    if (processedCheck.error) {
      return err(processedCheck.error);
    }
    if (processedCheck.data === true) {
      return ok(undefined);
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

  private async checkEventProcessed(
    walletStub: DurableObjectStub<Wallet>,
    eventId: string
  ): Promise<Result<boolean, string>> {
    try {
      const isProcessed = await walletStub.isEventProcessed(eventId);
      if (isProcessed) {
        console.log(`Event ${eventId} has already been processed, skipping`);
        return ok(true);
      }
      return ok(false);
    } catch (e) {
      const errorMessage = `Failed to check if event ${eventId} has been processed: ${
        e instanceof Error ? e.message : "Unknown error"
      }`;
      console.error(errorMessage);
      return err(errorMessage);
    }
  }

  private async handleTokenUsagePaymentSucceeded(
    eventId: string,
    paymentIntent: Stripe.PaymentIntent,
    walletStub: DurableObjectStub<Wallet>,
    orgId: string
  ): Promise<Result<void, string>> {
    const { creditsCents, totalCents } =
      this.getPaymentIntentBreakdown(paymentIntent);
    try {
      await walletStub.addCredits(creditsCents, eventId);
      console.log(
        `Added ${creditsCents} cents of credits (total collected ${totalCents} cents) to wallet for org ${orgId} for payment intent ${paymentIntent.id} event ${eventId}`
      );
      return ok(undefined);
    } catch (e) {
      const errorMessage = `Failed to process payment intent ${paymentIntent.id} for org ${orgId} with credits amount ${creditsCents}: ${e instanceof Error ? e.message : "Unknown error"}`;
      console.error(errorMessage);
      return err(errorMessage);
    }
  }

  private async handleRefundCreated(
    eventId: string,
    refund: Stripe.Refund
  ): Promise<Result<void, string>> {
    // TEMP DISABLE while in beta. If someone wants to refund, we probably want to manually
    // refund them and manage their wallet on the admin side, rather tahn automatically refunding them
    return ok(undefined);

    // // Only process succeeded refunds
    // if (refund.status !== "succeeded") {
    //   console.log(
    //     `Skipping refund ${refund.id} with status ${refund.status}, only processing succeeded refunds`
    //   );
    //   return ok(undefined);
    // }

    // // Only process USD refunds
    // if (refund.currency.toUpperCase() !== "USD") {
    //   console.log(
    //     `Skipping refund ${refund.id} with currency ${refund.currency}, only processing USD refunds`
    //   );
    //   return ok(undefined);
    // }

    // // Get the payment intent to find the customer
    // if (!refund.payment_intent) {
    //   console.log(`Skipping refund ${refund.id} with no payment_intent`);
    //   return ok(undefined);
    // }

    // let customerId: string | null = null;
    // let paymentIntent: Stripe.PaymentIntent;

    // // Check if payment_intent is already an expanded object
    // if (typeof refund.payment_intent === "object") {
    //   paymentIntent = refund.payment_intent as Stripe.PaymentIntent;

    //   if (typeof paymentIntent.customer === "string") {
    //     customerId = paymentIntent.customer;
    //   } else if (
    //     typeof paymentIntent.customer === "object" &&
    //     paymentIntent.customer !== null &&
    //     "id" in paymentIntent.customer
    //   ) {
    //     customerId = paymentIntent.customer.id;
    //   }
    // } else {
    //   // Payment intent is just an ID string, need to fetch it
    //   try {
    //     paymentIntent = await this.stripe.paymentIntents.retrieve(
    //       refund.payment_intent
    //     );

    //     if (typeof paymentIntent.customer === "string") {
    //       customerId = paymentIntent.customer;
    //     } else if (
    //       typeof paymentIntent.customer === "object" &&
    //       paymentIntent.customer !== null &&
    //       "id" in paymentIntent.customer
    //     ) {
    //       customerId = paymentIntent.customer.id;
    //     }
    //   } catch (e) {
    //     console.error(
    //       `Failed to retrieve payment intent ${refund.payment_intent} for refund ${refund.id}:`,
    //       e
    //     );
    //     return err("Failed to retrieve payment intent");
    //   }
    // }

    // // Check if payment intent has the correct productId
    // if (!paymentIntent.metadata?.productId) {
    //   console.log(
    //     `Skipping refund ${refund.id} - payment intent has no productId in metadata`
    //   );
    //   return ok(undefined);
    // }

    // if (
    //   paymentIntent.metadata.productId !==
    //   this.env.STRIPE_CLOUD_GATEWAY_TOKEN_USAGE_PRODUCT
    // ) {
    //   console.log(
    //     `Skipping refund ${refund.id} - productId ${paymentIntent.metadata.productId} does not match STRIPE_CLOUD_GATEWAY_TOKEN_USAGE_PRODUCT`
    //   );
    //   return ok(undefined);
    // }

    // if (!customerId) {
    //   console.error(`Unable to get Stripe customer id for refund ${refund.id}`);
    //   return err("Unable to get Stripe customer id from refund");
    // }

    // const orgId = await getOrgIdFromStripeCustomerId(this.env, customerId);
    // if (!orgId) {
    //   return err("Unable to get org id from refund");
    // }

    // const walletId = this.wallet.idFromName(orgId);
    // const walletStub = this.wallet.get(walletId);

    // const processedCheck = await this.checkEventProcessed(walletStub, eventId);
    // if (processedCheck.error) {
    //   return err(processedCheck.error);
    // }
    // if (processedCheck.data === true) {
    //   return ok(undefined);
    // }

    // const { creditsCents, totalCents } =
    //   this.getPaymentIntentBreakdown(paymentIntent);
    // const refundAmountCents = refund.amount;

    // let creditsToDeduct: number;
    // if (totalCents > 0 && creditsCents > 0) {
    //   const proportionalCredits = Math.round(
    //     (refundAmountCents * creditsCents) / totalCents
    //   );

    //   creditsToDeduct = Math.min(
    //     creditsCents,
    //     refundAmountCents,
    //     Math.max(proportionalCredits, 0)
    //   );
    // } else {
    //   creditsToDeduct = Math.min(creditsCents, refundAmountCents);
    // }

    // // Deduct the refund amount from the wallet
    // try {
    //   const deductResult = await walletStub.deductCredits(
    //     creditsToDeduct,
    //     eventId,
    //     orgId
    //   );

    //   if (deductResult.error) {
    //     console.error(
    //       `Failed to deduct credits for refund ${refund.id} for org ${orgId}: ${deductResult.error}`
    //     );
    //     return err(deductResult.error);
    //   }

    //   console.log(
    //     `Deducted ${creditsToDeduct} cents of credits (refund ${refundAmountCents} cents total, fee portion refunded ${feePortionRefunded} cents) from wallet for org ${orgId} for refund ${refund.id} event ${eventId}`
    //   );
    //   return ok(undefined);
    // } catch (e) {
    //   const errorMessage = `Failed to process refund ${refund.id} for org ${orgId} with amount ${refund.amount}: ${
    //     e instanceof Error ? e.message : "Unknown error"
    //   }`;
    //   console.error(errorMessage);
    //   return err(errorMessage);
    // }
  }

  private async handleDisputeCreated(
    eventId: string,
    dispute: Stripe.Dispute
  ): Promise<Result<void, string>> {
    console.log(`Processing dispute created: ${dispute.id}`);

    // Only process USD disputes
    if (dispute.currency.toUpperCase() !== "USD") {
      console.log(
        `Skipping dispute ${dispute.id} with currency ${dispute.currency}, only processing USD disputes`
      );
      return ok(undefined);
    }

    // Get the charge to find the customer
    let charge: Stripe.Charge;
    if (typeof dispute.charge === "string") {
      try {
        charge = await this.stripe.charges.retrieve(dispute.charge);
      } catch (e) {
        console.error(
          `Failed to retrieve charge ${dispute.charge} for dispute ${dispute.id}:`,
          e
        );
        return err("Failed to retrieve charge for dispute");
      }
    } else {
      charge = dispute.charge;
    }

    // Get payment intent to check if it's our product
    if (!charge.payment_intent) {
      console.log(
        `Skipping dispute ${dispute.id} - charge has no payment_intent`
      );
      return ok(undefined);
    }

    let paymentIntent: Stripe.PaymentIntent;
    if (typeof charge.payment_intent === "string") {
      try {
        paymentIntent = await this.stripe.paymentIntents.retrieve(
          charge.payment_intent
        );
      } catch (e) {
        console.error(
          `Failed to retrieve payment intent ${charge.payment_intent} for dispute ${dispute.id}:`,
          e
        );
        return err("Failed to retrieve payment intent for dispute");
      }
    } else {
      paymentIntent = charge.payment_intent;
    }

    // Check if this is for our token usage product
    if (
      !paymentIntent.metadata?.productId ||
      paymentIntent.metadata.productId !==
        this.env.STRIPE_CLOUD_GATEWAY_TOKEN_USAGE_PRODUCT
    ) {
      console.log(
        `Skipping dispute ${dispute.id} - not for token usage product`
      );
      return ok(undefined);
    }

    // Get customer ID
    let customerId: string | null = null;
    if (typeof charge.customer === "string") {
      customerId = charge.customer;
    } else if (
      typeof charge.customer === "object" &&
      charge.customer !== null &&
      "id" in charge.customer
    ) {
      customerId = charge.customer.id;
    }

    if (!customerId) {
      console.error(
        `Unable to get Stripe customer id for dispute ${dispute.id}`
      );
      return err("Unable to get Stripe customer id from dispute");
    }

    const orgId = await getOrgIdFromStripeCustomerId(this.env, customerId);
    if (!orgId) {
      return err("Unable to get org id from dispute");
    }

    const walletId = this.wallet.idFromName(orgId);
    const walletStub = this.wallet.get(walletId);

    const processedCheck = await this.checkEventProcessed(walletStub, eventId);
    if (processedCheck.error) {
      return err(processedCheck.error);
    }
    if (processedCheck.data === true) {
      return ok(undefined);
    }

    // Add dispute to wallet and suspend it
    try {
      const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge.id;
      const addResult = await walletStub.addDispute(
        dispute.id,
        chargeId,
        dispute.amount,
        dispute.currency,
        dispute.reason,
        dispute.status,
        eventId
      );

      if (addResult.error) {
        console.error(
          `Failed to add dispute ${dispute.id} for org ${orgId}: ${addResult.error}`
        );
        return err(addResult.error);
      }

      console.log(
        `Added dispute ${dispute.id} for org ${orgId} and suspended wallet`
      );

      return ok(undefined);
    } catch (e) {
      const errorMessage = `Failed to process dispute ${dispute.id} for org ${orgId}: ${
        e instanceof Error ? e.message : "Unknown error"
      }`;
      console.error(errorMessage);
      return err(errorMessage);
    }
  }

  private async handleDisputeUpdated(
    eventId: string,
    dispute: Stripe.Dispute
  ): Promise<Result<void, string>> {
    console.log(`Processing dispute updated: ${dispute.id}`);

    // Only process USD disputes
    if (dispute.currency.toUpperCase() !== "USD") {
      return ok(undefined);
    }

    // Get org from dispute charge
    const orgId = await this.getOrgIdFromDispute(dispute);
    if (!orgId) {
      return ok(undefined);
    }

    const walletId = this.wallet.idFromName(orgId);
    const walletStub = this.wallet.get(walletId);

    const processedCheck = await this.checkEventProcessed(walletStub, eventId);
    if (processedCheck.error) {
      return err(processedCheck.error);
    }
    if (processedCheck.data === true) {
      return ok(undefined);
    }

    try {
      const updateResult = await walletStub.updateDispute(
        dispute.id,
        dispute.status,
        eventId
      );

      if (updateResult.error) {
        console.error(
          `Failed to update dispute ${dispute.id}: ${updateResult.error}`
        );
        return err(updateResult.error);
      }

      console.log(`Updated dispute ${dispute.id} status to ${dispute.status}`);
      return ok(undefined);
    } catch (e) {
      const errorMessage = `Failed to update dispute ${dispute.id}: ${
        e instanceof Error ? e.message : "Unknown error"
      }`;
      console.error(errorMessage);
      return err(errorMessage);
    }
  }

  private async getOrgIdFromDispute(
    dispute: Stripe.Dispute
  ): Promise<string | null> {
    try {
      // Get the charge to find the customer
      let charge: Stripe.Charge;
      if (typeof dispute.charge === "string") {
        charge = await this.stripe.charges.retrieve(dispute.charge);
      } else {
        charge = dispute.charge;
      }

      // Get customer ID
      let customerId: string | null = null;
      if (typeof charge.customer === "string") {
        customerId = charge.customer;
      } else if (
        typeof charge.customer === "object" &&
        charge.customer !== null &&
        "id" in charge.customer
      ) {
        customerId = charge.customer.id;
      }

      if (!customerId) {
        return null;
      }

      return await getOrgIdFromStripeCustomerId(this.env, customerId);
    } catch (e) {
      console.error("Error getting org ID from dispute:", e);
      return null;
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
