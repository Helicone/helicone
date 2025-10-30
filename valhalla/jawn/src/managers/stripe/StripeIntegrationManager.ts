import { BaseManager } from "../BaseManager";
import { AuthParams } from "../../packages/common/auth/types";
import { Result, err, ok } from "../../packages/common/result";
import { IntegrationManager } from "../IntegrationManager";
import { VaultManager } from "../VaultManager";
import Stripe from "stripe";
import { subdivide } from "../../utils/subdivide";
import { sendMeteredBatch } from "./sendBatchEvent";

type StripeMeterEvent = Stripe.V2.Billing.MeterEventStreamCreateParams.Event;

// Sanitize error messages to prevent sensitive information leakage
function sanitizeStripeError(error: unknown): string {
  if (error instanceof Error) {
    // Common Stripe error patterns that are safe to expose
    if (error.message.includes("Invalid API key")) {
      return "Invalid Stripe API key configuration";
    }
    if (error.message.includes("No such customer")) {
      return "Invalid Stripe customer ID";
    }
    if (error.message.includes("meter event")) {
      return "Meter event configuration error";
    }
    if (error.message.includes("rate limit")) {
      return "Stripe API rate limit exceeded";
    }
    if (error.message.includes("network")) {
      return "Network error connecting to Stripe";
    }
    // Generic error for other cases
    return "Stripe API error occurred";
  }
  return "Unknown error occurred";
}

export class StripeIntegrationManager extends BaseManager {
  private integrationManager: IntegrationManager;
  private vaultManager: VaultManager;

  constructor(authParams: AuthParams) {
    super(authParams);
    this.integrationManager = new IntegrationManager(authParams);
    this.vaultManager = new VaultManager(authParams);
  }

  public async testMeterEvent(
    integrationId: string,
    eventName: string,
    customerId: string
  ): Promise<Result<string, string>> {
    try {
      // 1. Validate integration exists and is active for this organization
      const integration =
        await this.integrationManager.getIntegration(integrationId);
      if (integration.error) {
        return err(`Integration not found: ${integration.error}`);
      }

      if (!integration.data?.active) {
        return err("Integration is not active");
      }

      if (integration.data.integration_name !== "stripe") {
        return err("Integration is not a Stripe integration");
      }

      // 2. Get Stripe key from vault
      const stripeKeys =
        await this.vaultManager.getDecryptedProviderKeysByOrgId();
      if (stripeKeys.error) {
        return err(`Failed to get vault keys: ${stripeKeys.error}`);
      }

      const stripeKey = stripeKeys.data?.find(
        (key) => key.provider_name === "HELICONE_STRIPE_KEY"
      );

      if (!stripeKey || !stripeKey.provider_key) {
        return err("Stripe API key not found in vault");
      }

      // Validate API key format (basic check)
      if (!stripeKey.provider_key.match(/^(sk_|rk_)/)) {
        return err("Invalid Stripe API key format");
      }

      // 3. Create test meter events (input and output tokens)
      const timestamp = Date.now();
      const isoTimestamp = new Date().toISOString();

      const inputTokenEvent: StripeMeterEvent = {
        identifier: `helicone-test-${timestamp}-input`,
        event_name: eventName,
        timestamp: isoTimestamp,
        payload: {
          stripe_customer_id: customerId,
          value: "40",
          token_type: "input",
          model: "openai/gpt-4o",
        },
      };

      const outputTokenEvent: StripeMeterEvent = {
        identifier: `helicone-test-${timestamp}-output`,
        event_name: eventName,
        timestamp: isoTimestamp,
        payload: {
          stripe_customer_id: customerId,
          value: "60",
          token_type: "output",
          model: "openai/gpt-4o",
        },
      };

      // 4. Create Stripe client with user's key and send meter events
      const stripe = new Stripe(stripeKey.provider_key);

      try {
        // Send both input and output token events
        await stripe.v2.billing.meterEvents.create(inputTokenEvent);
        await stripe.v2.billing.meterEvents.create(outputTokenEvent);

        return ok(
          "Test meter events sent successfully (40 input tokens + 60 output tokens)"
        );
      } catch (stripeError) {
        const errorMessage = sanitizeStripeError(stripeError);
        return err(`Failed to send meter events to Stripe: ${errorMessage}`);
      }
    } catch (error) {
      return err(`Error testing meter event: ${error}`);
    }
  }

  public async sendMeterEvents(
    events: StripeMeterEvent[]
  ): Promise<Result<string, string>> {
    try {
      if (events.length === 0) {
        return ok("No events to send");
      }

      // 1. Get Stripe integration for this organization to verify it's active
      const integration =
        await this.integrationManager.getIntegrationByType("stripe");
      if (integration.error) {
        return err(`Stripe integration not found: ${integration.error}`);
      }

      if (!integration.data) {
        return err("Stripe integration not configured");
      }

      if (!integration.data.active) {
        return err("Stripe integration is not active");
      }

      // 2. Get Stripe key from vault
      const stripeKeys =
        await this.vaultManager.getDecryptedProviderKeysByOrgId();
      if (stripeKeys.error) {
        return err(`Failed to get vault keys: ${stripeKeys.error}`);
      }

      const stripeKey = stripeKeys.data?.find(
        (key) => key.provider_name === "HELICONE_STRIPE_KEY"
      );

      if (!stripeKey || !stripeKey.provider_key) {
        return err("Stripe API key not found in vault");
      }

      // Validate API key format (basic check)
      if (!stripeKey.provider_key.match(/^(sk_|rk_)/)) {
        return err("Invalid Stripe API key format");
      }

      // 3. Create Stripe client with user's key
      const stripe = new Stripe(stripeKey.provider_key);

      // 4. Send meter events in batches (Stripe has limits)
      const batchSize = 100; // Conservative batch size
      const batches = [];

      for (let i = 0; i < events.length; i += batchSize) {
        batches.push(events.slice(i, i + batchSize));
      }

      let totalProcessed = 0;
      const errors = [];

      const meterEventSession =
        await stripe.v2.billing.meterEventSession.create();

      for (const batch of batches) {
        try {
          await sendMeteredBatch(batch, meterEventSession.authentication_token);

          totalProcessed += batch.length;
        } catch (stripeError) {
          const errorMessage = sanitizeStripeError(stripeError);
          errors.push(`Batch failed: ${errorMessage}`);
        }
      }

      if (errors.length > 0) {
        return err(
          `Processed ${totalProcessed}/${events.length} events. Errors: ${errors.join(", ")}`
        );
      }

      return ok(`Successfully sent ${totalProcessed} meter events to Stripe`);
    } catch (error) {
      return err(`Error sending meter events: ${error}`);
    }
  }
}
