import { Result, err, ok } from "../util/results";
import { OrganizationStore, UsageEligibleOrgs } from "../db/OrganizationStore";
import { RequestResponseStore } from "../db/RequestResponseStore";
import { StripeClient } from "../client/StripeClient";

export class UsageManager {
  constructor(
    private organizationStore: OrganizationStore,
    private requestResponseStore: RequestResponseStore,
    private stripeClient: StripeClient
  ) {}

  async chargeOrgUsage(): Promise<Result<string, string>> {
    const today = new Date();
    today.setDate(today.getDate());
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const usageEligibleOrgs =
      await this.organizationStore.getUsageEligibleOrganizations(yesterdayStr);

    if (usageEligibleOrgs.error || !usageEligibleOrgs.data) {
      return err(usageEligibleOrgs.error || "No eligible organizations found.");
    }

    const promises: Promise<Result<string, string>>[] =
      usageEligibleOrgs.data.map((org) =>
        this.handleOrganizationUsage(org, yesterday, today, yesterdayStr)
      );

    await Promise.all(promises);

    return ok("Success");
  }

  async handleOrganizationUsage(
    org: UsageEligibleOrgs,
    yesterdayDateTime: Date,
    todayDateTime: Date,
    yesterdayStr: string
  ): Promise<Result<string, string>> {
    let requestQuantity = 0;

    try {
      const requestCountResult =
        await this.requestResponseStore.getRequestCountByOrgId(
          org.id,
          yesterdayDateTime,
          todayDateTime
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

      requestQuantity = requestCountResult.data;
      const { data: usageRecord, error: usageRecordErr } =
        await this.addStripeUsageRecord({
          orgId: org.id,
          stripeSubscriptionItemId: org.stripe_subscription_item_id,
          quantity: requestQuantity,
          usageDate: yesterdayStr,
        });

      if (usageRecordErr || !usageRecord) {
        throw new Error(`Failed to add Stripe usage record: ${usageRecordErr}`);
      }

      await this.organizationStore.upsertOrgUsage({
        organization_id: org.id,
        quantity: requestQuantity,
        usage_date: yesterdayStr,
        error_message: null,
        type: "request",
        stripe_record: JSON.parse(usageRecord),
        recorded: true,
        updated_at: new Date().toISOString(),
      });

      return ok("Success");
    } catch (error: any) {
      await this.organizationStore.upsertOrgUsage({
        organization_id: org.id,
        quantity: requestQuantity,
        usage_date: yesterdayStr,
        error_message: error.message,
        type: "request",
        stripe_record: null,
        recorded: false,
        updated_at: new Date().toISOString(),
      });

      return err(error.message || "Unknown error handling organization usage.");
    }
  }

  async addStripeUsageRecord({
    orgId,
    stripeSubscriptionItemId,
    quantity,
    usageDate,
  }: {
    orgId: string;
    stripeSubscriptionItemId: string;
    quantity: number;
    usageDate: string;
  }): Promise<Result<string, string>> {
    try {
      const usageRecord = await this.stripeClient.addUsageRecord({
        subscriptionItemId: stripeSubscriptionItemId,
        quantity: quantity,
        timestamp: "now",
        action: "increment",
        idempotencyKey: `${orgId}-${usageDate}`,
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
