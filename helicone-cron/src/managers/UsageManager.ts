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
      usageEligibleOrgs.data.map((org) => this.handleOrganizationUsage(org));

    await Promise.all(promises);

    return ok("Success");
  }

  async handleOrganizationUsage(
    org: UsageEligibleOrgs
  ): Promise<Result<string, string>> {
    let requestQuantity = 0;
    let startDate: Date;
    if (!org.latestEndTime) {
      // Get current period start date from stripe
      const subscription = await this.stripeClient.getSubscriptionById(
        org.stripeSubscriptionItemId
      );

      if (subscription.error || !subscription.data) {
        return err(
          subscription.error || "Failed to get subscription from Stripe."
        );
      }

      subscription.data.start_date;
      startDate = new Date(subscription.data.current_period_start * 1000);
    } else {
      startDate = new Date(org.latestEndTime);
    }
    const endDate = new Date();

    try {
      const requestCountResult =
        await this.requestResponseStore.getRequestCountByOrgId(
          org.orgId,
          startDate,
          endDate
        );

      if (requestCountResult.error || !requestCountResult.data) {
        throw new Error(
          requestCountResult.error || "Failed to get request count."
        );
      }

      if (!org.stripeSubscriptionItemId) {
        throw new Error(
          "Organization does not have a Stripe subscription item ID."
        );
      }

      requestQuantity = requestCountResult.data;
      const { data: usageRecord, error: usageRecordErr } =
        await this.addStripeUsageRecord({
          orgId: org.orgId,
          stripeSubscriptionItemId: org.stripeSubscriptionItemId,
          quantity: requestQuantity,
          startDate: startDate,
        });

      if (usageRecordErr || !usageRecord) {
        throw new Error(`Failed to add Stripe usage record: ${usageRecordErr}`);
      }

      await this.organizationStore.upsertOrgUsage({
        organization_id: org.orgId,
        quantity: requestQuantity,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        error_message: null,
        type: "request",
        stripe_record: JSON.parse(usageRecord),
        recorded: true,
        updated_at: new Date().toISOString(),
      });

      return ok("Success");
    } catch (error: any) {
      await this.organizationStore.upsertOrgUsage({
        organization_id: org.orgId,
        quantity: requestQuantity,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
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
    startDate,
  }: {
    orgId: string;
    stripeSubscriptionItemId: string;
    quantity: number;
    startDate: Date;
  }): Promise<Result<string, string>> {
    try {
      const usageRecord = await this.stripeClient.addUsageRecord({
        subscriptionItemId: stripeSubscriptionItemId,
        quantity: quantity,
        timestamp: "now",
        action: "increment",
        idempotencyKey: `${orgId}-${startDate}`,
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
