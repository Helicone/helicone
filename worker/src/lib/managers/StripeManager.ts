import Stripe from "stripe";
import { ok, err, Result } from "../util/results";
import { Wallet } from "../durableObjects/Wallet";
import retry from "async-retry";
import { isError } from "../../../../packages/common/result";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";

export const STRIPE_INPUT_TOKEN_EVENT_NAME = "cloud_gateway_input_tokens";
export const STRIPE_OUTPUT_TOKEN_EVENT_NAME = "cloud_gateway_output_tokens";
export const STRIPE_CACHED_TOKEN_EVENT_NAME =
  "cloud_gateway_cached_token_usage";

export class StripeManager {
  private webhookSecret: string;
  private stripeSecretKey: string;
  private wallet: DurableObjectNamespace<Wallet>;
  private stripe: Stripe;
  private supabaseClient: SupabaseClient<Database>;

  constructor(
    webhookSecret: string,
    stripeSecretKey: string,
    wallet: DurableObjectNamespace<Wallet>,
    supabaseClient: SupabaseClient<Database>
  ) {
    this.webhookSecret = webhookSecret;
    this.stripeSecretKey = stripeSecretKey;
    this.wallet = wallet;
    this.stripe = new Stripe(this.stripeSecretKey, {
      apiVersion: "2025-07-30.basil",
      httpClient: Stripe.createFetchHttpClient(),
    });
    this.supabaseClient = supabaseClient;
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

  async getCreditBalance(
    stripeCustomerId: string
  ): Promise<{ balance: number }> {
    const creditBalanceSummary =
      await this.stripe.billing.creditBalanceSummary.retrieve({
        customer: stripeCustomerId,
        filter: {
          type: "applicability_scope",
          applicability_scope: {
            price_type: "metered",
          },
        },
      });

    if (
      500 <= creditBalanceSummary.lastResponse.statusCode &&
      creditBalanceSummary.lastResponse.statusCode < 600
    ) {
      throw new Error(
        `Failed to get credit balance: ${creditBalanceSummary.lastResponse.statusCode}`
      );
    }

    let totalBalance = 0;
    if (
      creditBalanceSummary.balances &&
      Array.isArray(creditBalanceSummary.balances)
    ) {
      for (const balance of creditBalanceSummary.balances) {
        if (
          balance.available_balance?.type === "monetary" &&
          balance.available_balance?.monetary?.currency === "usd" &&
          typeof balance.available_balance?.monetary?.value === "number"
        ) {
          totalBalance += balance.available_balance.monetary.value;
        }
      }
    }

    return { balance: totalBalance };
  }

  async getCreditBalanceWithRetry(
    stripeCustomerId: string
  ): Promise<Result<{ balance: number }, string>> {
    try {
      const balance = await retry<{ balance: number }>(
        async () => {
          return await this.getCreditBalance(stripeCustomerId);
        },
        {
          retries: 3,
          factor: 2,
          minTimeout: 500,
          maxTimeout: 5000,
          randomize: true,
        }
      );

      return ok(balance);
    } catch (e) {
      console.error(`Failed to get credit balance with retry: ${e}`);
      return err(e instanceof Error ? e.message : "Unknown error");
    }
  }

  async emitTokenUsage(
    stripeCustomerId: string,
    usage: {
      model: string;
      promptTokens: number;
      completionTokens: number;
      promptCacheWriteTokens: number;
      promptCacheReadTokens: number;
    }
  ): Promise<Result<void, string>> {
    const inputTokenEvent = await this.emitMeterEventWithRetry(
      STRIPE_INPUT_TOKEN_EVENT_NAME,
      {
        stripe_customer_id: stripeCustomerId,
        model: usage.model,
        value: usage.promptTokens.toString(),
      }
    );
    if (isError(inputTokenEvent)) {
      console.error(
        "Error emitting input token usage event",
        inputTokenEvent.error
      );
    }
    const outputTokenEvent = await this.emitMeterEventWithRetry(
      STRIPE_OUTPUT_TOKEN_EVENT_NAME,
      {
        stripe_customer_id: stripeCustomerId,
        model: usage.model,
        value: usage.promptTokens.toString(),
      }
    );
    if (isError(outputTokenEvent)) {
      console.error(
        "Error emitting output token usage event",
        outputTokenEvent.error
      );
    }
    const cachedTokenEvent = await this.emitMeterEventWithRetry(
      STRIPE_CACHED_TOKEN_EVENT_NAME,
      {
        stripe_customer_id: stripeCustomerId,
        model: usage.model,
        value: (
          usage.promptCacheReadTokens + usage.promptCacheWriteTokens
        ).toString(),
      }
    );
    if (isError(cachedTokenEvent)) {
      console.error(
        "Error emitting cached token usage event",
        cachedTokenEvent.error
      );
    }
    return ok(undefined);
  }

  private async emitMeterEventWithRetry(
    eventName: string,
    payload: Record<string, string>
  ): Promise<Result<Stripe.Response<Stripe.V2.Billing.MeterEvent>, string>> {
    try {
      const meterEvent = await retry<
        Stripe.Response<Stripe.V2.Billing.MeterEvent>
      >(
        async () => {
          const result = await this.stripe.v2.billing.meterEvents.create({
            event_name: eventName,
            payload,
          });

          const code = result?.lastResponse?.statusCode;
          if (
            typeof code === "number" &&
            (code === 429 || (code >= 500 && code < 600))
          ) {
            throw new Error(`Retryable status code: ${code}`);
          }

          return result;
        },
        {
          retries: 5,
          factor: 2,
          minTimeout: 250,
          maxTimeout: 6000,
          randomize: true,
        }
      );

      return ok(meterEvent);
    } catch (e) {
      const errorMessage = `Failed to emit meter event with retry: ${e instanceof Error ? e.message : "Unknown error"}`;
      console.error(errorMessage);
      return err(errorMessage);
    }
  }

  private async handlePaymentIntentSucceeded(
    eventId: string,
    paymentIntent: Stripe.PaymentIntent
  ): Promise<Result<void, string>> {
    console.debug(
      `Processing payment intent succeeded: ${paymentIntent.id}`,
      JSON.stringify(paymentIntent)
    );

    if (paymentIntent.currency.toUpperCase() !== "USD") {
      console.debug(
        `Payment intent currency is not USD, skipping: ${paymentIntent.id}`
      );
      return ok(undefined);
    }
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

    const orgId = await this.supabaseClient
      .from("organization")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .eq("soft_delete", false)
      .single();

    if (!orgId.data?.id) {
      return err("Unable to get org id from payment intent");
    }

    const walletId = this.wallet.idFromName(orgId.data?.id);
    const walletStub = this.wallet.get(walletId);
    const amount = paymentIntent.amount_received;

    try {
      const newBalance = await walletStub.addBalance(orgId.data?.id, amount, eventId);
      const creditGrantResult = await this.stripe.billing.creditGrants.create({
        name: 'Cloud Gateway Token Usage Credits',
        customer: customerId,
        amount: {
          monetary: {
            currency: 'usd',
            value: amount,
          },
          type: 'monetary',
        },
        applicability_config: {
          scope: {
            price_type: 'metered',
          },
        },
        category: 'paid',
      });
      if (creditGrantResult.lastResponse.statusCode >= 400) {
        console.error(
          `Failed to create credit grant for payment intent ${paymentIntent.id}: ${creditGrantResult.lastResponse.statusCode}`
        );
        return err(`Failed to create credit grant for payment intent ${paymentIntent.id}: ${creditGrantResult.lastResponse.statusCode}`);
      }
      console.log(
        `Added ${amount} to wallet for org ${orgId.data?.id} due to event ${eventId}`
      );
      return ok(undefined);
    } catch (e) {
      const errorMessage = `Failed to process payment intent ${paymentIntent.id} for org ${orgId.data?.id} with amount ${amount}: ${e instanceof Error ? e.message : "Unknown error"}`;
      console.error(errorMessage);
      return err(errorMessage);
    }
  }
}
