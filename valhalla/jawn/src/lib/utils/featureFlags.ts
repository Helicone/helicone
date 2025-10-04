import { dbExecute } from "../shared/db/dbExecute";
import { Result, err, ok } from "../../packages/common/result";

export const HQL_FEATURE_FLAG = "hql";
export const AI_GATEWAY_FEATURE_FLAG = "ai_gateway";

/**
 * Check if an organization has access to a specific feature flag
 * Only checks in production environment
 */
export async function checkFeatureFlag(
  organizationId: string,
  feature: string,
): Promise<Result<boolean, string>> {
  try {
    const { data } = await dbExecute<{
      id: string;
    }>(`SELECT id FROM feature_flags WHERE org_id = $1 AND feature = $2`, [
      organizationId,
      feature,
    ]);

    // Allow by default outside production to make local/dev/test flows easier
    if (process.env.NODE_ENV === "production") {
      if (!data || data.length === 0) {
        return err(`You do not have access to ${feature}`);
      }
    }

    return ok(true);
  } catch (error) {
    console.error(`Error checking feature flag ${feature}:`, error);
    return err(`Error checking feature flag ${feature}`);
  }
}
