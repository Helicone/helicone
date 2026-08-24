import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";
import { SecureCacheEnv, getAndStoreInCache } from "../util/cache/secureCache";
import { Result, ok, err } from "../util/results";

export class FeatureFlagManager {
  private supabaseClient: SupabaseClient<Database>;
  private secureCacheEnv: SecureCacheEnv;

  constructor(private env: Env) {
    this.supabaseClient = createClient(
      this.env.SUPABASE_URL,
      this.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.secureCacheEnv = {
      SECURE_CACHE: env.SECURE_CACHE,
      REQUEST_CACHE_KEY: env.REQUEST_CACHE_KEY,
      REQUEST_CACHE_KEY_2: env.REQUEST_CACHE_KEY_2,
    };
  }

  /**
   * Check if an organization has a specific feature enabled
   * @param orgId The organization ID
   * @param feature The feature name (e.g., "credits", "ptb_enabled")
   * @returns true if the feature is enabled, false otherwise
   */
  async hasFeature(orgId: string, feature: string): Promise<boolean> {
    const features = await this.getFeatureFlags(orgId);
    if (features.error || !features.data) {
      // Default to disabled if we can't fetch features
      return false;
    }
    return features.data.includes(feature);
  }

  /**
   * Get all feature flags for an organization
   * Cached for 5 minutes to reduce database load
   */
  private async getFeatureFlags(
    orgId: string
  ): Promise<Result<string[], string>> {
    return await getAndStoreInCache<string[], string>(
      `feature-flags-${orgId}`,
      this.secureCacheEnv,
      async () => {
        try {
          const { data, error } = await this.supabaseClient
            .from("feature_flags")
            .select("feature")
            .eq("org_id", orgId);

          if (error) {
            console.error("Error fetching feature flags:", error);
            return err(`Failed to fetch feature flags: ${error.message}`);
          }

          const features = data?.map((row) => row.feature) || [];
          return ok(features);
        } catch (e) {
          console.error("Exception fetching feature flags:", e);
          return err(
            e instanceof Error
              ? e.message
              : "Unknown error fetching feature flags"
          );
        }
      },
      300 // 5 minute TTL
    );
  }
}
