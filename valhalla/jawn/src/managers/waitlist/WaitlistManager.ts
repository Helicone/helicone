import { LoopsClient } from "loops";
import { GET_KEY } from "../../lib/clients/constant";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { err, ok, Result } from "../../packages/common/result";
import { AuthParams } from "../../packages/common/auth/types";

const SUPPORTED_FEATURES = ["credits"] as const;
export type SupportedFeature = (typeof SUPPORTED_FEATURES)[number];

export class WaitlistManager {
  public static isSupportedFeature(feature: string): feature is SupportedFeature {
    return SUPPORTED_FEATURES.includes(feature as SupportedFeature);
  }

  public async addToWaitlist(
    email: string,
    feature: string,
    organizationId?: string
  ): Promise<Result<{ success: boolean; position?: number }, string>> {
    if (!WaitlistManager.isSupportedFeature(feature)) {
      return err(`Unsupported feature: ${feature}`);
    }

    try {
      const { error: dbError, data } = await dbExecute<{ position: string }>(
        `INSERT INTO feature_waitlist (email, feature, organization_id) 
         VALUES ($1, $2, $3)
         ON CONFLICT (email, feature) DO NOTHING
         RETURNING 
           (SELECT COUNT(*) FROM feature_waitlist WHERE feature = $2) as position`,
        [email, feature, organizationId || null]
      );

      if (dbError) {
        if (dbError.includes("duplicate") || dbError.includes("conflict")) {
          return err("already_on_waitlist");
        }
        console.error(`Error adding to waitlist: ${dbError}`);
        return err("Failed to add to waitlist");
      }

      const position = data?.[0]?.position;

      // Update Loops contact
      try {
        const loopsApiKey = await GET_KEY("key:loops");
        if (loopsApiKey) {
          const loops = new LoopsClient(loopsApiKey);
          const waitlistProperty = `${feature}_waitlist`;

          try {
            await loops.updateContact({
              email,
              properties: { [waitlistProperty]: "true" },
            });
          } catch {
            await loops.createContact({
              email,
              properties: { [waitlistProperty]: "true" },
            });
          }
        }
      } catch (loopsError) {
        console.error("Error updating Loops contact:", loopsError);
      }

      return ok({
        success: true,
        position: position ? parseInt(position) : undefined,
      });
    } catch (error: any) {
      console.error(`Failed to add to waitlist: ${error.message || error}`);
      return err("Failed to add to waitlist");
    }
  }

  public async isOnWaitlist(
    email: string,
    feature: string
  ): Promise<Result<{ isOnWaitlist: boolean }, string>> {
    if (!WaitlistManager.isSupportedFeature(feature)) {
      return err(`Unsupported feature: ${feature}`);
    }

    try {
      const result = await dbExecute(
        `SELECT 1 FROM feature_waitlist 
         WHERE email = $1 AND feature = $2
         LIMIT 1`,
        [email, feature]
      );

      if (result.error) {
        console.error(`Failed to check waitlist status: ${result.error}`);
        return err("Failed to check waitlist status");
      }

      const isOnWaitlist = (result.data && result.data.length > 0) || false;
      return ok({ isOnWaitlist });
    } catch (error: any) {
      console.error(`Failed to check waitlist status: ${error.message || error}`);
      return err("Failed to check waitlist status");
    }
  }

  public async getWaitlistCount(
    feature: string
  ): Promise<Result<{ count: number }, string>> {
    if (!WaitlistManager.isSupportedFeature(feature)) {
      return err(`Unsupported feature: ${feature}`);
    }

    try {
      const result = await dbExecute<{ count: string }>(
        `SELECT COUNT(*) as count FROM feature_waitlist WHERE feature = $1`,
        [feature]
      );

      if (result.error) {
        console.error(`Failed to get waitlist count: ${result.error}`);
        return err("Failed to get waitlist count");
      }

      const count = result.data?.[0]?.count || "0";
      return ok({ count: parseInt(count) });
    } catch (error: any) {
      console.error(`Failed to get waitlist count: ${error.message || error}`);
      return err("Failed to get waitlist count");
    }
  }

  public async trackShare(
    email: string,
    feature: string,
    platform: "twitter" | "linkedin"
  ): Promise<Result<{ 
    success: boolean; 
    newPosition?: number;
    message: string;
  }, string>> {
    if (!WaitlistManager.isSupportedFeature(feature)) {
      return err(`Unsupported feature: ${feature}`);
    }

    try {
      const boostAmount = 10;

      // Check if this platform was already shared
      const checkResult = await dbExecute<{ metadata: { shared_platforms?: string[] } }>(
        `SELECT metadata FROM feature_waitlist 
         WHERE email = $1 AND feature = $2`,
        [email, feature]
      );

      const sharedPlatforms = checkResult.data?.[0]?.metadata?.shared_platforms || [];
      if (sharedPlatforms.includes(platform)) {
        return err("Already shared on this platform");
      }

      // Update priority_boost and add platform to shared_platforms array
      const updateResult = await dbExecute<{ 
        priority_boost: string;
        original_position: string;
        new_position: string;
      }>(
        `UPDATE feature_waitlist 
         SET 
           priority_boost = COALESCE(priority_boost, 0) + $3,
           metadata = jsonb_set(
             COALESCE(metadata, '{}'::jsonb),
             '{shared_platforms}',
             COALESCE(metadata->'shared_platforms', '[]'::jsonb) || to_jsonb($4::text)
           )
         WHERE email = $1 AND feature = $2
         RETURNING 
           priority_boost,
           original_position,
           (SELECT COUNT(*) + 1 
            FROM feature_waitlist 
            WHERE feature = $2 
            AND COALESCE(original_position, 999999) - COALESCE(priority_boost, 0) < 
                COALESCE(original_position, 999999) - priority_boost
           ) as new_position`,
        [email, feature, boostAmount, platform]
      );

      if (updateResult.error || !updateResult.data?.length) {
        return err("Not found on waitlist");
      }

      const newPosition = updateResult.data[0].new_position;

      return ok({
        success: true,
        newPosition: newPosition ? parseInt(newPosition) : undefined,
        message: `You moved up ${boostAmount} spots!`
      });
    } catch (error: any) {
      console.error(`Failed to track share: ${error.message || error}`);
      return err("Failed to track share");
    }
  }
}