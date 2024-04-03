import { Result } from "../util/results";
import { OrganizationStore } from "../db/OrganizationStore";
import { RequestResponseStore } from "../db/RequestResponseStore";
import { StripeClient } from "../client/StripeClient";
import { Database } from "../db/database.types";

export class UsageManager {
  constructor(
    private organizationStore: OrganizationStore,
    private requestResponseStore: RequestResponseStore,
    private stripeClient: StripeClient
  ) {}

  async chargeOrgUsage(): Promise<Result<string, string>> {
    const growthOrgs = await this.organizationStore.getOrgsByTier(
      "growth",
      true
    );

    if (growthOrgs.error || !growthOrgs.data) {
      return { data: null, error: growthOrgs.error };
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const promises = growthOrgs.data.map((org) =>
      this.handleOrganization(org, yesterday, today)
    );

    await Promise.all(promises);

    return { data: "Success", error: null };
  }

  async handleOrganization(
    org: Database["public"]["Tables"]["organization"]["Row"],
    yesterday: Date,
    today: Date
  ): Promise<void> {
    try {
      const requestCountResult =
        await this.requestResponseStore.getRequestCountByOrgId(
          org.id,
          yesterday,
          today
        );

      if (
        requestCountResult.error ||
        !requestCountResult.data ||
        !org.stripe_subscription_item_id
      ) {
        throw new Error(
          requestCountResult.error ||
            "Missing necessary data for Stripe record creation."
        );
      }

      const stripeResult = await this.addStripeUsageRecord({
        stripeSubscriptionItemId: org.stripe_subscription_item_id,
        quantity: requestCountResult.data,
        yesterday,
      });

      if (stripeResult.error) {
        throw new Error(stripeResult.error);
      }

      const usageRecord = stripeResult.data;

      await this.organizationStore.insertOrgUsage({
        organization_id: org.id,
        usage_count: requestCountResult.data,
        usage_date: yesterday.toISOString(),
        error_message: null,
        usage_type: "request",
        stripe_record: usageRecord,
        recorded: true,
      });
    } catch (error: any) {
      await this.organizationStore.insertOrgUsage({
        organization_id: org.id,
        usage_count: 0,
        usage_date: yesterday.toISOString(),
        error_message: error.message,
        usage_type: "request",
        stripe_record: null,
        recorded: false,
      });
    }
  }

  async addStripeUsageRecord({
    stripeSubscriptionItemId,
    quantity,
    yesterday,
  }: {
    stripeSubscriptionItemId: string;
    quantity: number;
    yesterday: Date;
  }): Promise<Result<string, string>> {
    try {
      const usageRecord = await this.stripeClient.addUsageRecord({
        subscriptionItemId: stripeSubscriptionItemId,
        quantity: quantity,
        timestamp: Math.floor(yesterday.getTime() / 1000),
        action: "increment",
      });

      if (usageRecord.error || !usageRecord.data) {
        return { data: null, error: "Failed to add Stripe usage record." };
      }

      return { data: JSON.stringify(usageRecord.data), error: null };
    } catch (error: any) {
      return {
        data: null,
        error: error.message || "Unknown error adding Stripe usage record.",
      };
    }
  }
}
