import { Stripe } from "stripe";
import { err, ok, Result } from "../util/results";

type Action = "increment" | "set";
type UsageRecord = {
  subscriptionItemId: string;
  quantity: number;
  timestamp: "now" | number;
  action: Action;
  idempotencyKey: string;
};

export class StripeClient {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: "2023-10-16",
    });
  }

  async getSubscriptionById(
    subscriptionId: string
  ): Promise<Result<Stripe.Subscription, string>> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(
        subscriptionId
      );
      return ok(subscription);
    } catch (error: any) {
      return err(`Error getting subscription. ${error.message}`);
    }
  }

  async constructEvent(
    body: string,
    sig: string,
    webhookSecret: string
  ): Promise<Result<Stripe.Event, string>> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        sig,
        webhookSecret
      );
      return ok(event);
    } catch (error: any) {
      return err(`Error constructing event. ${error.message}`);
    }
  }

  getDataFromSubscription(subscription: Stripe.Subscription): {
    subscriptionId: string;
    subscriptionItemId: string;
    orgId: string;
  } {
    const subscriptionId = subscription.id;
    const subscriptionItemId = subscription?.items.data[0].id;
    const orgId = subscription.metadata?.orgId;

    return { subscriptionId, subscriptionItemId, orgId };
  }

  async addUsageRecord({
    subscriptionItemId,
    quantity,
    timestamp,
    action,
    idempotencyKey,
  }: UsageRecord): Promise<
    Result<Stripe.Response<Stripe.UsageRecord>, string>
  > {
    try {
      const usageRecord = await this.stripe.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity,
          action,
          timestamp,
        },
        {
          idempotencyKey,
        }
      );

      return ok(usageRecord);
    } catch (error: any) {
      return err(`Error adding usage record. ${error.message}`);
    }
  }
}
