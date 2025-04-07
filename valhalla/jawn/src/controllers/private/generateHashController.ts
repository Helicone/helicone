// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { hashAuth } from "../../utils/hash";
import { JawnAuthenticatedRequest } from "../../types/request";
import { KeyPermissions } from "../../packages/common/auth/types";
import { dbExecute } from "../../lib/shared/db/dbExecute";

export interface GenerateHashQueryParams {
  apiKey: string;
  governance: boolean;
  keyName: string;
  permissions: KeyPermissions;
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
    const { apiKey, keyName, governance } = requestBody;
    const userId = request.authParams.userId;
    if (!userId) {
      this.setStatus(401);
      return {
        error: {
          message: "Unauthorized",
        },
      };
    }
    try {
      const hashedKey = await hashAuth(apiKey);

      const { error } = await dbExecute(
        `INSERT INTO helicone_api_keys
         (api_key_hash, user_id, api_key_name, organization_id, key_permissions, governance)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          hashedKey,
          userId,
          keyName,
          request.authParams.organizationId,
          requestBody.permissions,
          governance,
        ]
      );

      if (error) {
        this.setStatus(500);
        return {
          error: {
            message: "Failed to insert key",
            details: error,
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
