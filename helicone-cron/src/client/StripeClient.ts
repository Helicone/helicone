import { Stripe } from "stripe";
import { err, ok, Result } from "../util/results";

type Action = "increment" | "set";
type UsageRecord = {
  subscriptionItemId: string;
  quantity: number;
  timestamp: number;
  action: Action;
};

export class StripeClient {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: "2023-10-16",
    });
  }

  async addUsageRecord({
    subscriptionItemId,
    quantity,
    timestamp,
    action,
  }: UsageRecord): Promise<
    Result<Stripe.Response<Stripe.UsageRecord>, string>
  > {
    try {
      const usageRecord = await this.stripe.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity,
          timestamp,
          action,
        },
        {
          idempotencyKey: `${subscriptionItemId}-${timestamp}`,
        }
      );

      return ok(usageRecord);
    } catch (error: any) {
      return err(`Error adding usage record. ${error.message}`);
    }
  }
}
