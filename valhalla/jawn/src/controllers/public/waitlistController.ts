import { LoopsClient } from "loops";
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { GET_KEY } from "../../lib/clients/constant";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { err, ok, Result } from "../../packages/common/result";
import { type JawnAuthenticatedRequest } from "../../types/request";

const SUPPORTED_FEATURES = ["credits"] as const;

type SupportedFeature = (typeof SUPPORTED_FEATURES)[number];

@Route("v1/public/waitlist")
@Tags("Waitlist")
export class WaitListController extends Controller {
  @Post("/feature")
  public async addToWaitlist(
    @Body()
    body: {
      email: string;
      feature: string;
      organizationId?: string;
    },
    @Request() request?: JawnAuthenticatedRequest
  ): Promise<Result<{ success: boolean; message: string }, string>> {
    // Validate feature
    if (!SUPPORTED_FEATURES.includes(body.feature as SupportedFeature)) {
      this.setStatus(400);
      return err(`Unsupported feature: ${body.feature}`);
    }

    // Use organizationId from body if provided, otherwise from auth params if available
    const organizationId =
      body.organizationId || request?.authParams?.organizationId;

    try {
      // Add to database waitlist (ignoring organization_id for uniqueness)
      const { error: dbError } = await dbExecute(
        `INSERT INTO feature_waitlist (email, feature, organization_id) 
         VALUES ($1, $2, $3)
         ON CONFLICT (email, feature) DO NOTHING`,
        [body.email, body.feature, organizationId || null]
      );

      if (dbError) {
        // Check if it's a duplicate entry error
        if (dbError.includes("duplicate") || dbError.includes("conflict")) {
          this.setStatus(409);
          return err("already_on_waitlist");
        }
        console.error(`Error adding to waitlist: ${dbError}`);
        this.setStatus(500);
        return err("Failed to add to waitlist");
      }

      // Update Loops contact
      try {
        const loopsApiKey = await GET_KEY("key:loops");
        if (loopsApiKey) {
          const loops = new LoopsClient(loopsApiKey);

          // Check if contact exists
          let contactExists = false;
          try {
            const existingContact = await loops.findContact({
              email: body.email,
            });
            contactExists = !!existingContact && existingContact.length > 0;
          } catch (findError) {
            // Contact doesn't exist, we'll create it
            console.log(
              `Contact ${body.email} not found in Loops, will create new`
            );
          }

          // Prepare the property name for this feature waitlist
          const waitlistProperty = `${body.feature}_waitlist`;

          if (contactExists) {
            // Update existing contact
            await loops.updateContact({
              email: body.email,
              properties: {
                [waitlistProperty]: "true",
              },
            });
          } else {
            // Create new contact
            await loops.createContact({
              email: body.email,
              properties: {
                [waitlistProperty]: "true",
              },
            });
          }
        }
      } catch (loopsError) {
        // Log but don't fail the request if Loops update fails
        console.error("Error updating Loops contact:", loopsError);
      }

      this.setStatus(200);
      return ok({
        success: true,
        message: `Added to ${body.feature} waitlist`,
      });
    } catch (error: any) {
      console.error(`Error in addToWaitlist: ${error.message}`);
      this.setStatus(500);
      return err(error.message || "Internal server error");
    }
  }

  @Get("/feature/status")
  public async isOnWaitlist(
    @Query() email: string,
    @Query() feature: string,
    @Query() organizationId: string | undefined,
    @Request() request?: JawnAuthenticatedRequest
  ): Promise<Result<{ isOnWaitlist: boolean }, string>> {
    // Validate feature
    if (!SUPPORTED_FEATURES.includes(feature as SupportedFeature)) {
      this.setStatus(400);
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
        console.error(`Error checking waitlist status: ${result.error}`);
        this.setStatus(500);
        return err("Failed to check waitlist status");
      }

      const isOnWaitlist = result.data && result.data.length > 0;

      this.setStatus(200);
      return ok({ isOnWaitlist: isOnWaitlist ?? false });
    } catch (error: any) {
      console.error(`Error in isOnWaitlist: ${error.message}`);
      this.setStatus(500);
      return err(error.message || "Internal server error");
    }
  }

  @Get("/feature/count")
  public async getWaitlistCount(
    @Query() feature: string,
    @Request() request?: JawnAuthenticatedRequest
  ): Promise<Result<{ count: number }, string>> {
    // Validate feature
    if (!SUPPORTED_FEATURES.includes(feature as SupportedFeature)) {
      this.setStatus(400);
      return err(`Unsupported feature: ${feature}`);
    }

    try {
      const result = await dbExecute(
        `SELECT COUNT(*) as count FROM feature_waitlist WHERE feature = $1`,
        [feature]
      );

      if (result.error) {
        console.error(`Error getting waitlist count: ${result.error}`);
        this.setStatus(500);
        return err("Failed to get waitlist count");
      }

      const count = result.data?.[0]?.count || 0;

      this.setStatus(200);
      return ok({ count: parseInt(count) });
    } catch (error: any) {
      console.error(`Error in getWaitlistCount: ${error.message}`);
      this.setStatus(500);
      return err(error.message || "Internal server error");
    }
  }

  @Post("/feature/share")
  public async trackShare(
    @Body()
    body: {
      email: string;
      feature: string;
      platform: "twitter" | "linkedin";
      action: "like" | "repost" | "both";
      organizationId?: string;
    },
    @Request() request?: JawnAuthenticatedRequest
  ): Promise<Result<{ 
    success: boolean; 
    newPosition?: number;
    priorityBoost?: number;
    message: string;
  }, string>> {
    // Validate feature
    if (!SUPPORTED_FEATURES.includes(body.feature as SupportedFeature)) {
      this.setStatus(400);
      return err(`Unsupported feature: ${body.feature}`);
    }

    const organizationId =
      body.organizationId || request?.authParams?.organizationId;

    try {
      // Define boost amounts for different actions
      let boostAmount = 0;
      if (body.platform === "twitter") {
        if (body.action === "like") boostAmount = 5;      // Like only = 5 spots
        else if (body.action === "repost") boostAmount = 10; // Repost only = 10 spots
        else if (body.action === "both") boostAmount = 20;   // Both = 20 spots (bonus!)
      } else if (body.platform === "linkedin") {
        if (body.action === "like") boostAmount = 5;
        else if (body.action === "repost") boostAmount = 10;
        else if (body.action === "both") boostAmount = 20;
      }

      // Check if this platform was already shared
      const checkResult = await dbExecute(
        `SELECT metadata FROM feature_waitlist 
         WHERE email = $1 AND feature = $2`,
        [body.email, body.feature]
      );

      const sharedPlatforms = checkResult.data?.[0]?.metadata?.shared_platforms || [];
      if (sharedPlatforms.includes(body.platform)) {
        this.setStatus(409);
        return err("Already shared on this platform");
      }

      // Update priority_boost and add platform to shared_platforms array
      const updateResult = await dbExecute(
        `UPDATE feature_waitlist 
         SET 
           priority_boost = COALESCE(priority_boost, 0) + $3,
           metadata = jsonb_set(
             COALESCE(metadata, '{}'::jsonb),
             '{shared_platforms}',
             COALESCE(metadata->'shared_platforms', '[]'::jsonb) || to_jsonb($4::text)
           )
         WHERE email = $1 AND feature = $2
         RETURNING priority_boost, original_position`,
        [body.email, body.feature, boostAmount, body.platform]
      );

      if (updateResult.error || !updateResult.data?.length) {
        this.setStatus(404);
        return err("Not found on waitlist");
      }

      const newPriorityBoost = parseInt(updateResult.data[0].priority_boost);
      const originalPosition = parseInt(updateResult.data[0].original_position);

      // Calculate new position
      const positionResult = await dbExecute(
        `WITH all_users AS (
          SELECT 
            original_position - COALESCE(priority_boost, 0) as effective_position
          FROM feature_waitlist
          WHERE feature = $1
        )
        SELECT COUNT(*) + 1 as position
        FROM all_users
        WHERE effective_position < $2`,
        [body.feature, originalPosition - newPriorityBoost]
      );

      const newPosition = positionResult.data?.[0]?.position 
        ? parseInt(positionResult.data[0].position) 
        : undefined;

      this.setStatus(200);
      return ok({
        success: true,
        newPosition,
        priorityBoost: newPriorityBoost,
        message: `You moved up ${boostAmount} spots!`
      });
    } catch (error: any) {
      console.error(`Error in trackShare: ${error.message}`);
      this.setStatus(500);
      return err(error.message || "Internal server error");
    }
  }
}
