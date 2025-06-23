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

export type LatestRouterConfig = {
  id: string;
  name: string;
  version: string;
  config: string;
};

export type RouterConfig = {
  id: string;
  name: string;
  latestVersion: string;
  lastUpdatedAt: string;
};

export type CreateRouterConfigResult = {
  routerConfigId: string;
  routerVersionId: string;
  apiKey: string;
};

@Route("v1/gateway")
@Tags("Gateway")
@Security("api_key")
export class GatewayController extends Controller {
  @Get("/")
  public async getRouterConfigs(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<{ routerConfigs: RouterConfig[] }, string>> {
    const gatewayManager = new GatewayManager(request.authParams);
    const result = await gatewayManager.getRouterConfigs();
    if (result.error || !result.data) {
      return err(result.error ?? "Failed to get router configs");
    }
    return ok(result.data);
  }

  @Get("/:id")
  public async getLatestRouterConfig(
    @Request() request: JawnAuthenticatedRequest,
    @Path() id: string
  ): Promise<Result<LatestRouterConfig, string>> {
    const gatewayManager = new GatewayManager(request.authParams);
    const result = await gatewayManager.getLatestRouterConfig(id);
    if (result.error || !result.data) {
      return err(result.error ?? "Failed to get router config");
    }
    return ok(result.data);
  }

  @Post("/")
  public async createRouterConfig(
    @Request() request: JawnAuthenticatedRequest,
    @Body() body: { name: string; config: string }
  ): Promise<Result<CreateRouterConfigResult, string>> {
    try {
      const gatewayManager = new GatewayManager(request.authParams);
      const result = await gatewayManager.createRouterConfig({
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
  public async updateRouterConfig(
    @Request() request: JawnAuthenticatedRequest,
    @Path() id: string,
    @Body() body: { name: string; config: string }
  ): Promise<Result<null, string>> {
    const gatewayManager = new GatewayManager(request.authParams);
    const result = await gatewayManager.updateRouterConfig({
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
