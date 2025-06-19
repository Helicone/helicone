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
import { JawnAuthenticatedRequest } from "../../types/request";
import { err, ok, Result } from "../../packages/common/result";
import { GatewayManager } from "../../managers/gatewayManager";

export type GatewayConfig = {
  id: string;
  name: string;
  apiKey: string;
  version: string;
  config: string;
};

@Route("v1/gateway")
@Tags("Gateway")
@Security("api_key")
export class GatewayController extends Controller {
  @Get("/")
  public async getGatewayConfigs(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<
    Result<{ gatewayConfigs: { id: string; name: string }[] }, string>
  > {
    const gatewayManager = new GatewayManager(request.authParams);
    const result = await gatewayManager.getGatewayConfigs();
    if (result.error || !result.data) {
      return err(result.error ?? "Failed to get gateway configs");
    }
    return ok(result.data);
  }

  @Get("/:id")
  public async getGatewayConfig(
    @Request() request: JawnAuthenticatedRequest,
    @Path() id: string
  ): Promise<Result<GatewayConfig, string>> {
    const gatewayManager = new GatewayManager(request.authParams);
    const result = await gatewayManager.getGatewayConfig(id);
    if (result.error || !result.data) {
      return err(result.error ?? "Failed to get gateway config");
    }
    return ok(result.data);
  }

  @Post("/create")
  public async createGatewayConfig(
    @Request() request: JawnAuthenticatedRequest,
    @Body() body: { name: string; config: string }
  ): Promise<
    Result<
      { gatewayConfigId: string; gatewayVersionId: string; apiKey: string },
      string
    >
  > {
    try {
      const gatewayManager = new GatewayManager(request.authParams);
      const result = await gatewayManager.createGatewayConfig({
        name: body.name,
        config: body.config,
      });
      if (result.error) {
        return err(result.error);
      }
      if (!result.data) {
        return err("Failed to create gateway config");
      }
      return ok({
        gatewayConfigId: result.data.gatewayConfigId,
        gatewayVersionId: result.data.gatewayVersionId,
        apiKey: result.data.apiKey,
      });
    } catch (error) {
      return err(error as string);
    }
  }

  @Put("/:id")
  public async updateGatewayConfig(
    @Request() request: JawnAuthenticatedRequest,
    @Path() id: string,
    @Body() body: { name: string; config: string }
  ): Promise<Result<null, string>> {
    const gatewayManager = new GatewayManager(request.authParams);
    const result = await gatewayManager.updateGatewayConfig({
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
