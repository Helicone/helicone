import { LoopsClient } from "loops";
import { GET_KEY } from "../../lib/clients/constant";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { err, ok, Result } from "../../packages/common/result";
import { AuthParams } from "../../packages/common/auth/types";

const SUPPORTED_FEATURES = ["credits"] as const;
export type SupportedFeature = (typeof SUPPORTED_FEATURES)[number];

const LEGACY_WAITLIST_OFFSET = 370;

export class WaitlistManager {
  public static isSupportedFeature(feature: string): feature is SupportedFeature {
    return SUPPORTED_FEATURES.includes(feature as SupportedFeature);
  }

  public async addToWaitlist(
    email: string,
    feature: string,
    organizationId?: string
  ): Promise<Result<{ 
    success: boolean; 
    position?: number;
    alreadyOnList?: boolean;
    sharedPlatforms?: string[];
  }, string>> {
    if (!WaitlistManager.isSupportedFeature(feature)) {
      return err(`Unsupported feature: ${feature}`);
    }

    try {
      const { error: dbError, data } = await dbExecute<{ position: string }>(
        `INSERT INTO feature_waitlist (email, feature, organization_id, original_position, is_customer) 
         VALUES ($1, $2, $3, (SELECT COUNT(*) + 1 FROM feature_waitlist WHERE feature = $2), $4)
         ON CONFLICT (email, feature, organization_id) DO NOTHING
         RETURNING original_position as position`,
        [email, feature, organizationId || null, !!organizationId]
      );

      if (dbError) {
        if (dbError.includes("duplicate") || dbError.includes("conflict")) {
          return err("already_on_waitlist");
        }
        console.error(`Error adding to waitlist: ${dbError}`);
        return err("Failed to add to waitlist");
      }
      
      // Check if user was actually added (data exists) or if they were already on the list
      if (!data || data.length === 0) {
        // User is already on waitlist, get their current position and share status
        const existingResult = await dbExecute<{ 
          position: string;
          metadata: { shared_platforms?: string[] };
        }>(
          `SELECT 
            original_position as position,
            metadata
          FROM feature_waitlist
          WHERE email = $1 AND feature = $2`,
          [email, feature]
        );

        if (existingResult.data && existingResult.data.length > 0) {
          const userInfo = existingResult.data[0];
          const adjustedPosition = parseInt(userInfo.position) + LEGACY_WAITLIST_OFFSET;
          return ok({
            success: false,
            alreadyOnList: true,
            position: adjustedPosition,
            sharedPlatforms: userInfo.metadata?.shared_platforms || []
          });
        }
        
        return err("already_on_waitlist");
      }

      const position = data?.[0]?.position || "1";

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

      const adjustedPosition = position ? parseInt(position) + LEGACY_WAITLIST_OFFSET : undefined;
      return ok({
        success: true,
        position: adjustedPosition,
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

      const actualCount = parseInt(result.data?.[0]?.count || "0");
      const adjustedCount = actualCount + LEGACY_WAITLIST_OFFSET;
      return ok({ count: adjustedCount });
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
      const adjustedNewPosition = newPosition ? parseInt(newPosition) + LEGACY_WAITLIST_OFFSET : undefined;

      return ok({
        success: true,
        newPosition: adjustedNewPosition,
        message: adjustedNewPosition ? `New position: #${adjustedNewPosition}` : `You moved up!`
      });
    } catch (error: any) {
      console.error(`Failed to track share: ${error.message || error}`);
      return err("Failed to track share");
    }
  }
}