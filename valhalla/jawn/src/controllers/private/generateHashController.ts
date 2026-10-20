// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import generateApiKey from "generate-api-key";
import { hashAuth } from "../../utils/hash";
import { type JawnAuthenticatedRequest } from "../../types/request";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { setAPIKey } from "../../lib/refetchKeys";
import {
  authorizeOrgActor,
  isPermissionSubset,
  ORG_ADMIN_ROLES,
} from "../../utils/orgAuthz";

export interface GenerateHashQueryParams {
  keyName: string;
  permissions: "rw" | "w";
  governance: boolean;
  /** Adds the "-rl" prefix marker used by rate-limited keys. */
  enableRateLimit?: boolean;
  /** Adds the "-eu" prefix marker. Purely cosmetic; not a secret. */
  isEu?: boolean;
}

/**
 * Builds a new Helicone API key. The secret part always comes from the
 * server's CSPRNG-backed generator; callers only influence the public prefix.
 */
export function buildHeliconeApiKey(params: {
  permissions: "rw" | "w";
  organizationType: string;
  isEu: boolean;
  governance: boolean;
  enableRateLimit: boolean;
}): string {
  const apiKeyPrefix = params.permissions === "rw" ? "sk" : "pk";
  const isCustomer = params.organizationType === "customer";
  return `${apiKeyPrefix}${isCustomer ? "" : "-helicone"}${
    params.isEu ? "-eu" : ""
  }${isCustomer ? "-cp" : ""}${params.governance ? "-gov" : ""}${
    params.enableRateLimit ? "-rl" : ""
  }-${generateApiKey({
    method: "base32",
    dashes: true,
  }).toString()}`.toLowerCase();
}

@Route("v1/key")
@Tags("Utils")
@Security("api_key")
export class GenerateHashController extends Controller {
  /**
   * Creates a Helicone API key for the signed-in organization. The key is
   * generated server-side and returned once; it is never accepted from the
   * caller.
   */
  @Post("generateHash")
  public async generateHash(
    @Body()
    requestBody: GenerateHashQueryParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<{
    success?: boolean;
    apiKey?: string;
    error?: {
      message?: string;
      details?: string;
    };
  }> {
    // Only a signed-in owner/admin may mint keys. API keys (and proxy keys)
    // are rejected: they cannot be used to create further credentials.
    const actor = await authorizeOrgActor(request.authParams, ORG_ADMIN_ROLES);
    if (actor.error !== null) {
      this.setStatus(actor.error.status);
      return {
        error: {
          message: actor.error.message,
        },
      };
    }

    const { keyName, governance } = requestBody;
    if (
      requestBody.permissions !== "rw" &&
      requestBody.permissions !== "w"
    ) {
      this.setStatus(400);
      return { error: { message: "Invalid permissions" } };
    }
    // JWT owners/admins hold "rw"; requested permissions must be a subset.
    if (!isPermissionSubset(requestBody.permissions, "rw")) {
      this.setStatus(400);
      return { error: { message: "Invalid permissions" } };
    }

    const { data, error } = await dbExecute<{ count: number }>(
      `select count(*) from helicone_api_keys where soft_delete = false and organization_id = $1 and temp_key = false`,
      [actor.data.organizationId]
    );
    if (error) {
      this.setStatus(500);
      return {
        error: {
          message: "Failed to check key count",
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

    const org = await dbExecute<{ organization_type: string }>(
      `SELECT organization_type FROM organization WHERE id = $1 LIMIT 1`,
      [actor.data.organizationId]
    );
    if (org.error || !org.data?.[0]) {
      this.setStatus(500);
      return { error: { message: "Organization not found" } };
    }

    try {
      const apiKey = buildHeliconeApiKey({
        permissions: requestBody.permissions,
        organizationType: org.data[0].organization_type,
        isEu: requestBody.isEu === true,
        governance: governance === true,
        enableRateLimit: requestBody.enableRateLimit === true,
      });
      const hashedKey = await hashAuth(apiKey);

      const { error } = await dbExecute(
        `INSERT INTO helicone_api_keys
         (api_key_hash, user_id, api_key_name, organization_id, key_permissions, governance)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          hashedKey,
          actor.data.userId,
          keyName,
          actor.data.organizationId,
          requestBody.permissions,
          governance === true,
        ]
      );

      if (error) {
        this.setStatus(500);
        return {
          error: {
            message: "Failed to insert key",
          },
        };
      }
      setAPIKey(hashedKey, actor.data.organizationId, false).catch((error) => {
        console.error("error setting api key in gateway", error);
      });

      this.setStatus(201);
      return {
        success: true,
        apiKey,
      };
    } catch (error: any) {
      console.log(`Failed to generate key: ${error}`);
      this.setStatus(500);
      return {
        error: {
          message: "Failed to generate key",
        },
      };
    }
  }
}
