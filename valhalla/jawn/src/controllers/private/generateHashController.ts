// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { hashAuth } from "../../lib/db/hash";
import { supabaseServer } from "../../lib/routers/withAuth";
import { JawnAuthenticatedRequest } from "../../types/request";

export interface GenerateHashQueryParams {
  apiKey: string;
  userId: string;
  keyName: string;
}

@Route("v1/key")
@Tags("Utils")
@Security("api_key")
export class GenerateHashController extends Controller {
  @Post("generateHash")
  public async generateHash(
    @Body()
    requestBody: GenerateHashQueryParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<{
    success?: boolean;
    error?: {
      message?: string;
      details?: string;
    };
  }> {
    const { apiKey, userId, keyName } = requestBody;
    try {
      const hashedKey = await hashAuth(apiKey);

      const insertRes = await supabaseServer.client
        .from("helicone_api_keys")
        .insert({
          api_key_hash: hashedKey,
          user_id: userId,
          api_key_name: keyName,
          organization_id: request.authParams.organizationId,
        });

      if (insertRes.error) {
        this.setStatus(500);
        return {
          error: {
            message: "Failed to insert key",
            details: insertRes.error.message,
          },
        };
      }

      this.setStatus(201);
      return {
        success: true,
      };
    } catch (error: any) {
      console.log(`Failed to generate key hash: ${error}`);
      this.setStatus(500);
      return {
        error: {
          message: "Failed to generate key hash",
          details: error.message,
        },
      };
    }
  }
}
