import { BaseManager } from "../BaseManager";
import { AuthParams } from "../../packages/common/auth/types";
import { Result, err, ok } from "../../packages/common/result";
import { IntegrationManager } from "../IntegrationManager";
import { VaultManager } from "../VaultManager";
import Stripe from "stripe";

type StripeMeterEvent = Stripe.V2.Billing.MeterEventStreamCreateParams.Event;

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

      // 3. Create test meter event
      const testEvent: StripeMeterEvent = {
        identifier: `helicone-test-${Date.now()}`,
        event_name: eventName,
        timestamp: new Date().toISOString(),
        payload: {
          stripe_customer_id: customerId,
          value: "60",
          token_type: "output",
          model: "openai/gpt-4o",
        },
      };

      // 4. Create Stripe client with user's key and send meter event
      const stripe = new Stripe(stripeKey.provider_key);

      try {
        await stripe.v2.billing.meterEventStream.create({
          events: [testEvent]
        });

        return ok("Test meter event sent successfully");
      } catch (stripeError: any) {
        return err(`Failed to send meter event to Stripe: ${stripeError.message}`);
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
      const integration = await this.integrationManager.getIntegrationByType("stripe");
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
      const stripeKeys = await this.vaultManager.getDecryptedProviderKeysByOrgId();
      if (stripeKeys.error) {
        return err(`Failed to get vault keys: ${stripeKeys.error}`);
      }

      const stripeKey = stripeKeys.data?.find(
        (key) => key.provider_name === "HELICONE_STRIPE_KEY"
      );

      if (!stripeKey || !stripeKey.provider_key) {
        return err("Stripe API key not found in vault");
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

      for (const batch of batches) {
        try {
          await stripe.v2.billing.meterEventStream.create({
            events: batch
          });
          totalProcessed += batch.length;
        } catch (stripeError: any) {
          errors.push(`Batch failed: ${stripeError.message}`);
        }
      }

      if (errors.length > 0) {
        return err(`Processed ${totalProcessed}/${events.length} events. Errors: ${errors.join(', ')}`);
      }

      return ok(`Successfully sent ${totalProcessed} meter events to Stripe`);
    } catch (error) {
      return err(`Error sending meter events: ${error}`);
    }
  }
}
