import { Result, err, ok } from "../util/results";
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
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const eligibleGrowthOrgs =
      await this.organizationStore.getOrganizationsByTierAndUsage("growth", {
        isStripeCustomer: true,
        recorded: false,
        usageDate: yesterday,
      });

    if (eligibleGrowthOrgs.error || !eligibleGrowthOrgs.data) {
      return err(
        eligibleGrowthOrgs.error || "No eligible organizations found."
      );
    }

    const promises = eligibleGrowthOrgs.data.map((org) =>
      this.handleOrganizationUsage(org, yesterday, today)
    );

    await Promise.all(promises);

    return ok("Success");
  }

  async handleOrganizationUsage(
    org: Database["public"]["Tables"]["organization"]["Row"],
    yesterday: Date,
    today: Date
  ): Promise<Result<string, string>> {
    try {
      const requestCountResult =
        await this.requestResponseStore.getRequestCountByOrgId(
          org.id,
          yesterday,
          today
        );

      if (requestCountResult.error || !requestCountResult.data) {
        throw new Error(
          requestCountResult.error || "Failed to get request count."
        );
      }

      if (!org.stripe_subscription_item_id) {
        throw new Error(
          "Organization does not have a Stripe subscription item ID."
        );
      }

      const { data: usageRecord, error: usageRecordErr } =
        await this.addStripeUsageRecord({
          stripeSubscriptionItemId: org.stripe_subscription_item_id,
          quantity: requestCountResult.data,
          yesterday,
        });

      if (usageRecordErr || !usageRecord) {
        throw new Error(`Failed to add Stripe usage record: ${usageRecordErr}`);
      }

      await this.organizationStore.upsertOrgUsage({
        organization_id: org.id,
        usage_count: requestCountResult.data,
        usage_date: yesterday.toISOString(),
        error_message: null,
        usage_type: "request",
        stripe_record: usageRecord,
        recorded: true,
      });

      return ok("Success");
    } catch (error: any) {
      await this.organizationStore.upsertOrgUsage({
        organization_id: org.id,
        usage_count: 0,
        usage_date: yesterday.toISOString(),
        error_message: error.message,
        usage_type: "request",
        stripe_record: null,
        recorded: false,
      });

      return err(error.message || "Unknown error handling organization usage.");
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
        return err(`Failed to add Stripe usage record: ${usageRecord.error}`);
      }

      return ok(JSON.stringify(usageRecord.data));
    } catch (error: any) {
      return err(error.message || "Unknown error adding Stripe usage record.");
    }
  }
}
