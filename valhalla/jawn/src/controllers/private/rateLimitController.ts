import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { RateLimitManager } from "../../managers/rateLimitManager";
import type { JawnAuthenticatedRequest } from "../../types/request";
import { Result, err, ok } from "../../packages/common/result";

// Exported types for the API contract
export interface RateLimitRuleView {
  id: string;
  name: string;
  quota: number;
  window_seconds: number;
  unit: "request" | "cents";
  segment?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRateLimitRuleParams {
  name: string;
  quota: number;
  window_seconds: number;
  unit: "request" | "cents";
  segment?: string;
}

export interface UpdateRateLimitRuleParams
  extends Partial<CreateRateLimitRuleParams> {}

@Route("v1/rate-limits")
@Tags("Rate Limits")
@Security("api_key")
export class RateLimitController extends Controller {
  // Manager is now instantiated per request below

  @Get("/")
  public async getRateLimits(
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<RateLimitRuleView[], string>> {
    const rateLimitManager = new RateLimitManager(request.authParams);
    const result = await rateLimitManager.getOrgRateLimits();

    if (result.error || !result.data) {
      this.setStatus(500);
      return err(
        result.error || "Failed to fetch rate limits or no data found",
      );
    }
    return ok(result.data);
  }

  @Post("/")
  public async createRateLimit(
    @Body() params: CreateRateLimitRuleParams,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<RateLimitRuleView, string>> {
    const rateLimitManager = new RateLimitManager(request.authParams);
    const result = await rateLimitManager.createRateLimit(params);

    if (result.error || !result.data) {
      this.setStatus(result.error?.includes("Minimum time window") ? 400 : 500);
      return err(result.error || "Failed to create rate limit rule");
    }
    this.setStatus(201);
    return ok(result.data);
  }

  @Put("/{ruleId}")
  public async updateRateLimit(
    @Path() ruleId: string,
    @Body() params: UpdateRateLimitRuleParams,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<RateLimitRuleView, string>> {
    const rateLimitManager = new RateLimitManager(request.authParams);
    const result = await rateLimitManager.updateRateLimit(ruleId, params);

    if (result.error || !result.data) {
      this.setStatus(
        result.error?.includes("Minimum time window")
          ? 400
          : result.error === "Rate limit rule not found"
            ? 404
            : 500,
      );
      return err(result.error || "Failed to update rate limit rule");
    }
    return ok(result.data);
  }

  @Delete("/{ruleId}")
  public async deleteRateLimit(
    @Path() ruleId: string,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<null, string>> {
    const rateLimitManager = new RateLimitManager(request.authParams);
    const result = await rateLimitManager.deleteRateLimit(ruleId);

    if (result.error) {
      this.setStatus(result.error.includes("not found") ? 404 : 500);
      return err(result.error || "Failed to delete rate limit rule");
    }

    this.setStatus(204);
    return ok(null);
  }
}
