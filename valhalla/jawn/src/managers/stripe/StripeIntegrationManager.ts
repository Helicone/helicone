import { BaseManager } from "../BaseManager";
import { AuthParams } from "../../packages/common/auth/types";
import { Result, err, ok } from "../../packages/common/result";
import { StripeManager } from "./StripeManager";
import { IntegrationManager } from "../IntegrationManager";
import { VaultManager } from "../VaultManager";
import Stripe from "stripe";

type StripeMeterEvent = Stripe.V2.Billing.MeterEventStreamCreateParams.Event;

export class StripeIntegrationManager extends BaseManager {
  private stripeManager: StripeManager;
  private integrationManager: IntegrationManager;
  private vaultManager: VaultManager;

  constructor(authParams: AuthParams) {
    super(authParams);
    this.stripeManager = new StripeManager(authParams);
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

      // 4. Send meter event using existing StripeManager
      const result = await this.stripeManager.trackStripeMeter([testEvent]);
      if (result.error) {
        return err(`Failed to send meter event: ${result.error}`);
      }

      return ok("Test meter event sent successfully");
    } catch (error) {
      return err(`Error testing meter event: ${error}`);
    }
  }
}
