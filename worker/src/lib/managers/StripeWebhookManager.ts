import Stripe from "stripe";
import { ok, err, Result } from "../util/results";
import { Wallet } from "../durableObjects/Wallet";

export class StripeWebhookManager {
  private webhookSecret: string;
  private stripeSecretKey: string;
  private wallet: DurableObjectNamespace<Wallet>;

  constructor(
    webhookSecret: string, 
    stripeSecretKey: string,
    wallet: DurableObjectNamespace<Wallet>
  ) {
    this.webhookSecret = webhookSecret;
    this.stripeSecretKey = stripeSecretKey;
    this.wallet = wallet;
  }

  async verifyAndConstructEvent(
    body: string,
    signature: string
  ): Promise<Result<Stripe.Event, string>> {
    try {
      const stripe = new Stripe(this.stripeSecretKey, {
        apiVersion: "2025-07-30.basil",
        httpClient: Stripe.createFetchHttpClient(),
      });

      const event = await stripe.webhooks.constructEventAsync(
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
        // TODO(ENG-2693): there is also `billing.credit_grant_transaction.created`,
        // docs are unclear on the difference between the two.
        case "billing.credit_grant.created":
          return await this.handleCreditGrantCreated(
            event.id,
            event.data.object as Stripe.Billing.CreditGrant
          );

        default:
          console.log(`Skipping processing of unknown event type: ${event.type}`);
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

  private async handleCreditGrantCreated(
    eventId: string,
    creditGrant: Stripe.Billing.CreditGrant
  ): Promise<Result<void, string>> {
    console.debug(
      `Processing credit grant created: ${creditGrant.id}`,
      JSON.stringify(creditGrant)
    );

    if (!creditGrant.amount.monetary) {
      console.debug(`Credit grant monetary object is null, skipping: ${creditGrant.id}`);
      return ok(undefined);
    }
    if (creditGrant.amount.monetary.currency.toUpperCase() !== "USD") {
      console.debug(`Credit grant currency is not USD, skipping: ${creditGrant.id}`);
      return ok(undefined);
    }
    if (!creditGrant.metadata?.orgId) {
      console.debug(`Credit grant metadata orgId is null, skipping: ${creditGrant.id}`);
      return ok(undefined);
    }
    
    const orgId = creditGrant.metadata.orgId;
    const amount = creditGrant.amount.monetary.value;

    const walletId = this.wallet.idFromName(orgId);
    const walletStub = this.wallet.get(walletId);

    try {
      const newBalance = await walletStub.addBalance(orgId, amount, eventId);
      console.log(`Added ${amount} to wallet for org ${orgId} due to event ${eventId}. New balance: ${newBalance}`);
      return ok(undefined);
    } catch (e) {
      const errorMessage = `Failed to process credit grant ${creditGrant.id} for org ${orgId} with amount ${amount}: ${e instanceof Error ? e.message : "Unknown error"}`;
      console.error(errorMessage);
      return err(errorMessage);
    }
  }
}