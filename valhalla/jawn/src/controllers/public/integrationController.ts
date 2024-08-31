import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { JawnAuthenticatedRequest } from "../../types/request";
import { IntegrationManager } from "../../managers/IntegrationManager";
import { Result } from "../../lib/shared/result";

export interface IntegrationCreateParams {
  integration_name: string;
  settings?: Record<string, any>;
  active?: boolean;
}

export interface IntegrationUpdateParams {
  integration_name?: string;
  settings?: Record<string, any>;
  active?: boolean;
}

export interface Integration extends IntegrationUpdateParams {
  id: string;
}

@Route("v1/integration")
@Tags("Integration")
@Security("api_key")
export class IntegrationController extends Controller {
  @Post("/")
  public async createIntegration(
    @Body() params: IntegrationCreateParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<{ id: string }, string>> {
    const integrationManager = new IntegrationManager(request.authParams);
    return await integrationManager.createIntegration(params);
  }

  @Get("/")
  public async getIntegrations(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Array<Integration>, string>> {
    const integrationManager = new IntegrationManager(request.authParams);
    return await integrationManager.getIntegrations();
  }

  @Post("/{integrationId}")
  public async updateIntegration(
    @Path() integrationId: string,
    @Body() params: IntegrationUpdateParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const integrationManager = new IntegrationManager(request.authParams);
    return await integrationManager.updateIntegration(integrationId, params);
  }

  @Get("/{integrationId}")
  public async getIntegration(
    @Path() integrationId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Integration, string>> {
    const integrationManager = new IntegrationManager(request.authParams);
    return await integrationManager.getIntegration(integrationId);
  }
}
