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

const SUPPORTED_FEATURES = ["credits", "hql"] as const;

type SupportedFeature = (typeof SUPPORTED_FEATURES)[number];

@Route("v1/public/waitlist")
@Tags("Waitlist")
@Security("api_key")
export class WaitListController extends Controller {
  @Post("/feature")
  public async addToWaitlist(
    @Body()
    body: {
      email: string;
      feature: string;
      organizationId?: string;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<{ success: boolean; message: string }, string>> {
    // Validate feature
    if (!SUPPORTED_FEATURES.includes(body.feature as SupportedFeature)) {
      this.setStatus(400);
      return err(`Unsupported feature: ${body.feature}`);
    }

    // Use organizationId from body if provided, otherwise from auth params
    const organizationId =
      body.organizationId || request.authParams.organizationId;

    try {
      // Add to database waitlist
      const { error: dbError } = await dbExecute(
        `INSERT INTO feature_waitlist (email, feature, organization_id) 
         VALUES ($1, $2, $3)
         ON CONFLICT (email, feature, organization_id) DO NOTHING`,
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
    @Request() request: JawnAuthenticatedRequest
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
         ${organizationId ? `AND organization_id = $3` : ""}
         LIMIT 1`,
        [email, feature, ...(organizationId ? [organizationId] : [])]
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
}
