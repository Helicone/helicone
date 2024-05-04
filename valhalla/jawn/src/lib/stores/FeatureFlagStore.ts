import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../db/database.types";
import { PromiseGenericResult, err, ok } from "../shared/result";

export class FeatureFlagStore {
  private supabaseClient: SupabaseClient<Database>;
  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabaseClient = supabaseClient;
  }

  async getFeatureFlagByOrgId(
    featureName: string,
    orgId: string
  ): PromiseGenericResult<
    Database["public"]["Tables"]["feature_flags"]["Row"] | null
  > {
    const featureFlag = await this.supabaseClient
      .from("feature_flags")
      .select("*")
      .eq("feature", featureName)
      .eq("org_id", orgId);

    if (featureFlag.error) {
      err(
        `Failed to get feature flag ${featureName} for org ${orgId}: ${featureFlag.error.message}`
      );
    }

    return ok(featureFlag.data?.[0] ?? null);
  }
}
