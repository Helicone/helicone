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
import { type JawnAuthenticatedRequest } from "../../types/request";
import { IntegrationManager } from "../../managers/IntegrationManager";
import { StripeIntegrationManager } from "../../managers/stripe/StripeIntegrationManager";
import { Result } from "../../packages/common/result";
import { Json } from "../../lib/db/database.types";

export interface IntegrationCreateParams {
  integration_name: string;
  settings?: Json;
  active?: boolean;
}

export interface IntegrationUpdateParams {
  integration_name?: string;
  settings?: Json;
  active?: boolean;
}

export interface Integration extends IntegrationUpdateParams {
  id: string;
}

export interface TestStripeMeterEventRequest {
  event_name: string;
  customer_id: string;
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

  @Get("/type/{type}")
  public async getIntegrationByType(
    @Path() type: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Integration, string>> {
    const integrationManager = new IntegrationManager(request.authParams);
    return await integrationManager.getIntegrationByType(type);
  }

  @Get("/slack/settings")
  public async getSlackSettings(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Integration, string>> {
    const integrationManager = new IntegrationManager(request.authParams);
    return await integrationManager.getIntegrationByType("slack");
  }

  @Get("/slack/channels")
  public async getSlackChannels(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Array<{ id: string; name: string }>, string>> {
    const integrationManager = new IntegrationManager(request.authParams);
    return await integrationManager.getSlackChannels();
  }

  @Post("/{integrationId}/stripe/test-meter-event")
  public async testStripeMeterEvent(
    @Path() integrationId: string,
    @Body() body: TestStripeMeterEventRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<string, string>> {
    const stripeIntegrationManager = new StripeIntegrationManager(
      request.authParams
    );

    const result = await stripeIntegrationManager.testMeterEvent(
      integrationId,
      body.event_name,
      body.customer_id
    );
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }
}
