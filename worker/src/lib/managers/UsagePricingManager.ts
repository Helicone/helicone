import { OrganizationStore } from "../db/OrganizationStore";

export class UsagePricingManager {
  constructor(private organizationStore: OrganizationStore) {}

  async updateUsagePricing(): Promise<void> {
    const { data: growthOrgs, error: growthOrgsErr } =
      await this.organizationStore.getOrgsByTier("growth", true);

    if (growthOrgsErr) {
      console.error(`Failed to get growth orgs: ${growthOrgsErr}`);
      return;
    }

    // Get all orgs that have a stripe customer id and tier growth
    // Retrieve request counts for past day
    // Retrieve prompt count total
    // Call stripe and update usage pricing
  }
}
