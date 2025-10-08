// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { hashAuth } from "../../utils/hash";
import { type JawnAuthenticatedRequest } from "../../types/request";
import { KeyPermissions } from "../../packages/common/auth/types";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { setAPIKey } from "../../lib/refetchKeys";

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
    const { data, error } = await dbExecute<{ count: number }>(
      `select count(*) from helicone_api_keys where soft_delete = false and organization_id = $1 and temp_key = false`,
      [request.authParams.organizationId]
    );
    if (error) {
      this.setStatus(500);
      return {
        error: {
          message: "Failed to check key count",
          details: error,
        },
      };
    }
    if ((data?.[0]?.count ?? 0) >= 50) {
      this.setStatus(400);
      return {
        error: {
          message:
            "You have reached the maximum number of keys for your organization",
        },
      };
    }
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
      setAPIKey(hashedKey, request.authParams.organizationId, false).catch(
        (error) => {
          console.error("error setting api key in gateway", error);
        }
      );

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
