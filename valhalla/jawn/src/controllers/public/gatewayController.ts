import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Put,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import type { JawnAuthenticatedRequest } from "../../types/request";
import { err, ok, Result } from "../../packages/common/result";
import { GatewayManager } from "../../managers/gatewayManager";
import {
  AI_GATEWAY_FEATURE_FLAG,
  checkFeatureFlag,
} from "../../lib/utils/featureFlags";
import { TimeIncrement } from "../../managers/helpers/getXOverTime";

export type LatestRouterConfig = {
  id: string;
  name: string;
  hash: string;
  version: string;
  config: string;
};

export type Router = {
  id: string;
  hash: string;
  name: string;
  latestVersion: string;
  lastUpdatedAt: string;
};

export type CreateRouterResult = {
  routerId: string;
  routerHash: string;
  routerVersionId: string;
};

export type RouterRequestsOverTime = {
  time: Date;
  count: number;
  status: number;
};

export type RouterCostOverTime = {
  time: Date;
  cost: number;
};

export type RouterLatencyOverTime = {
  time: Date;
  duration: number;
};

@Route("v1/gateway")
@Tags("Gateway")
@Security("api_key")
export class GatewayController extends Controller {
  @Get("/")
  public async getRouters(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<{ routers: Router[] }, string>> {
    const featureFlagResult = await checkFeatureFlag(
      request.authParams.organizationId,
      AI_GATEWAY_FEATURE_FLAG
    );
    if (featureFlagResult.error) {
      return err(featureFlagResult.error);
    }
    const gatewayManager = new GatewayManager(request.authParams);
    const result = await gatewayManager.getRouters();
    if (result.error || !result.data) {
      return err(result.error ?? "Failed to get routers");
    }
    return ok(result.data);
  }

  @Get("/:id")
  public async getLatestRouterConfig(
    @Request() request: JawnAuthenticatedRequest,
    @Path() id: string
  ): Promise<Result<LatestRouterConfig, string>> {
    const featureFlagResult = await checkFeatureFlag(
      request.authParams.organizationId,
      AI_GATEWAY_FEATURE_FLAG
    );
    if (featureFlagResult.error) {
      return err(featureFlagResult.error);
    }
    const gatewayManager = new GatewayManager(request.authParams);
    const result = await gatewayManager.getLatestRouterConfig(id);
    if (result.error || !result.data) {
      return err(result.error ?? "Failed to get router config");
    }
    return ok(result.data);
  }

  @Get("/:routerHash/requests-over-time")
  public async getRouterRequestsOverTime(
    @Request() request: JawnAuthenticatedRequest,
    @Path() routerHash: string
  ): Promise<Result<RouterRequestsOverTime[], string>> {
    const featureFlagResult = await checkFeatureFlag(
      request.authParams.organizationId,
      AI_GATEWAY_FEATURE_FLAG
    );
    if (featureFlagResult.error) {
      return err(featureFlagResult.error);
    }
    if (!request.query.start || !request.query.end) {
      return err("Start and end are required");
    }
    const gatewayManager = new GatewayManager(request.authParams);
    const result = await gatewayManager.getRouterRequestsOverTime(
      routerHash,
      {
        start: request.query.start as string,
        end: request.query.end as string,
      },
      (request.query?.dbIncrement ?? "hour") as TimeIncrement,
      Number(request.query?.timeZoneDifference ?? 0)
    );
    if (result.error || !result.data) {
      return err(result.error ?? "Failed to get router requests");
    }
    return ok(result.data);
  }

  @Get("/:routerHash/cost-over-time")
  public async getRouterCostOverTime(
    @Request() request: JawnAuthenticatedRequest,
    @Path() routerHash: string
  ): Promise<Result<RouterCostOverTime[], string>> {
    const featureFlagResult = await checkFeatureFlag(
      request.authParams.organizationId,
      AI_GATEWAY_FEATURE_FLAG
    );
    if (featureFlagResult.error) {
      return err(featureFlagResult.error);
    }
    if (!request.query.start || !request.query.end) {
      return err("Start and end are required");
    }
    const gatewayManager = new GatewayManager(request.authParams);
    const result = await gatewayManager.getRouterCostOverTime(
      routerHash,
      {
        start: request.query.start as string,
        end: request.query.end as string,
      },
      (request.query?.dbIncrement ?? "hour") as TimeIncrement,
      Number(request.query?.timeZoneDifference ?? 0)
    );
    if (result.error || !result.data) {
      return err(result.error ?? "Failed to get router cost");
    }
    return ok(result.data);
  }

  @Get("/:routerHash/latency-over-time")
  public async getRouterLatencyOverTime(
    @Request() request: JawnAuthenticatedRequest,
    @Path() routerHash: string
  ): Promise<Result<RouterLatencyOverTime[], string>> {
    const featureFlagResult = await checkFeatureFlag(
      request.authParams.organizationId,
      AI_GATEWAY_FEATURE_FLAG
    );
    if (featureFlagResult.error) {
      return err(featureFlagResult.error);
    }
    if (!request.query.start || !request.query.end) {
      return err("Start and end are required");
    }
    const gatewayManager = new GatewayManager(request.authParams);
    const result = await gatewayManager.getRouterLatencyOverTime(
      routerHash,
      {
        start: request.query.start as string,
        end: request.query.end as string,
      },
      (request.query?.dbIncrement ?? "hour") as TimeIncrement,
      Number(request.query?.timeZoneDifference ?? 0)
    );
    if (result.error || !result.data) {
      return err(result.error ?? "Failed to get router latency");
    }
    return ok(result.data);
  }
  @Post("/")
  public async createRouter(
    @Request() request: JawnAuthenticatedRequest,
    @Body() body: { name: string; config: string }
  ): Promise<Result<CreateRouterResult, string>> {
    const featureFlagResult = await checkFeatureFlag(
      request.authParams.organizationId,
      AI_GATEWAY_FEATURE_FLAG
    );
    if (featureFlagResult.error) {
      return err(featureFlagResult.error);
    }
    try {
      const gatewayManager = new GatewayManager(request.authParams);
      const result = await gatewayManager.createRouter({
        name: body.name,
        config: body.config,
      });
      if (result.error) {
        return err(result.error);
      }
      if (!result.data) {
        return err("Failed to create router config");
      }
      return ok(result.data);
    } catch (error) {
      return err(error as string);
    }
  }

  @Put("/:id")
  public async updateRouter(
    @Request() request: JawnAuthenticatedRequest,
    @Path() id: string,
    @Body() body: { name: string; config: string }
  ): Promise<Result<null, string>> {
    const featureFlagResult = await checkFeatureFlag(
      request.authParams.organizationId,
      AI_GATEWAY_FEATURE_FLAG
    );
    if (featureFlagResult.error) {
      return err(featureFlagResult.error);
    }
    const gatewayManager = new GatewayManager(request.authParams);
    const result = await gatewayManager.updateRouter({
      id,
      name: body.name,
      config: body.config,
    });
    if (result.error) {
      return err(result.error);
    }
    return ok(null);
  }
}
