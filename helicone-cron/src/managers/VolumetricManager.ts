import { Result } from "../util/results";
import { OrganizationStore } from "../db/OrganizationStore";
import { RequestResponseStore } from "../db/RequestResponseStore";

class VolumetricManager {
  constructor(
    private organizationStore: OrganizationStore,
    private requestResponseStore: RequestResponseStore
  ) {}

  async calculateOrgUsage(): Promise<Result<string, string>> {
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

    const orgIdToRequestCount: Record<string, number> = {};
    await Promise.all(
      growthOrgs.data.map(async (org) => {
        const requestCountResult =
          await this.requestResponseStore.getRequestCountByOrgId(
            org.id,
            yesterday,
            today
          );

        if (requestCountResult.error || !requestCountResult.data) {
          console.error(
            `Error fetching request count for org ID ${org.id}: ${requestCountResult.error}`
          );
          orgIdToRequestCount[org.id] = 0;
        } else {
          orgIdToRequestCount[org.id] = requestCountResult.data;
        }
      })
    );

    return { data: "Success", error: null };

    // Retrieve request counts for past day
    // Retrieve prompt count total
    // Call stripe and update usage pricing
  }
}
