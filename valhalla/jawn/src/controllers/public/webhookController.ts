import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { Result, err, ok } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import crypto from "crypto";
import { dbExecute } from "../../lib/shared/db/dbExecute";

export interface WebhookData {
  destination: string;
  config: Record<string, any>;
  includeData?: boolean;
}

@Route("/v1/webhooks")
@Tags("Webhooks")
@Security("api_key")
export class WebhookController extends Controller {
  @Post("/")
  public async newWebhook(
    @Body()
    webhookData: WebhookData,
    @Request() request: JawnAuthenticatedRequest
  ) {
    const newHMACKEY = crypto.randomBytes(32).toString("hex");

    const sampleRate = webhookData.config?.sampleRate ?? 100;

    if (typeof sampleRate !== "number" || sampleRate < 0 || sampleRate > 100) {
      this.setStatus(400);
      return err("Sample rate must be between 0 and 100");
    }

    const propertyFilters = webhookData.config?.propertyFilters ?? [];

    if (!Array.isArray(propertyFilters)) {
      this.setStatus(400);
      return err("Property filters must be an array");
    }

    for (const propertyFilter of propertyFilters) {
      if (
        typeof propertyFilter !== "object" ||
        typeof propertyFilter.key !== "string" ||
        typeof propertyFilter.value !== "string"
      ) {
        this.setStatus(400);
        return err(
          "Property filters must be an array of objects with key and value properties"
        );
      }
    }

    // Default includeData to true if not specified
    const includeData = webhookData.includeData !== false;

    const result = await dbExecute(
      `INSERT INTO webhooks (is_verified, org_id, txt_record, destination, version, config, hmac_key)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        true,
        request.authParams.organizationId,
        "",
        webhookData.destination,
        "2024-10-22",
        JSON.stringify({
          sampleRate,
          propertyFilters: propertyFilters.map((propertyFilter) => ({
            key: propertyFilter.key,
            value: propertyFilter.value,
          })),
          includeData,
        }),
        newHMACKEY,
      ]
    );
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error || "Failed to fetch evals");
    } else {
      this.setStatus(200);
      return ok(result.data);
    }
  }

  @Get("/")
  public async getWebhooks(@Request() request: JawnAuthenticatedRequest) {
    const result = await dbExecute<{
      id: string;
      created_at: string;
      destination: string;
      version: string;
      config: string;
      hmac_key: string;
    }>(
      `SELECT 
        id,
        created_at,
        destination,
        version,
        config,
        hmac_key
      FROM webhooks WHERE org_id = $1`,
      [request.authParams.organizationId]
    );

    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }

    return result;
  }

  @Delete("/{webhookId}")
  public async deleteWebhook(
    @Path() webhookId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const result = await dbExecute(
      `DELETE FROM webhooks WHERE id = $1 AND org_id = $2`,
      [webhookId, request.authParams.organizationId]
    );

    if (result.error) {
      this.setStatus(500);
      return err(result.error);
    } else {
      this.setStatus(201);
      return ok(null);
    }
  }
}
