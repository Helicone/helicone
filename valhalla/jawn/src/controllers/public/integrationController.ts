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
import {
  IntegrationManager,
  redactIntegration,
} from "../../managers/IntegrationManager";
import { StripeIntegrationManager } from "../../managers/stripe/StripeIntegrationManager";
import { Result, err, ok } from "../../packages/common/result";
import { Json } from "../../lib/db/database.types";
import { isJwtOrgAdmin } from "../../utils/providerKeyAccess";

export const INTEGRATION_FORBIDDEN_MESSAGE =
  "Only organization owners and admins can manage integrations";

// Simple per-organization fixed-window limit for the Stripe test endpoint,
// which sends real meter events with the org's Stripe key.
const TEST_METER_EVENT_LIMIT = 5;
const TEST_METER_EVENT_WINDOW_MS = 10 * 60 * 1000;
const testMeterEventWindows = new Map<
  string,
  { windowStart: number; count: number }
>();

export function consumeTestMeterEventQuota(
  organizationId: string,
  now: number = Date.now()
): boolean {
  const current = testMeterEventWindows.get(organizationId);
  if (!current || now - current.windowStart >= TEST_METER_EVENT_WINDOW_MS) {
    testMeterEventWindows.set(organizationId, { windowStart: now, count: 1 });
    if (testMeterEventWindows.size > 10_000) {
      for (const [key, value] of testMeterEventWindows) {
        if (now - value.windowStart >= TEST_METER_EVENT_WINDOW_MS) {
          testMeterEventWindows.delete(key);
        }
      }
    }
    return true;
  }
  if (current.count >= TEST_METER_EVENT_LIMIT) {
    return false;
  }
  current.count += 1;
  return true;
}

function redactResult<T extends { settings?: Json }>(
  result: Result<T, string>
): Result<T, string> {
  if (result.error || !result.data) {
    return result;
  }
  return ok(redactIntegration(result.data));
}

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
    if (!isJwtOrgAdmin(request.authParams)) {
      this.setStatus(403);
      return err(INTEGRATION_FORBIDDEN_MESSAGE);
    }
    const integrationManager = new IntegrationManager(request.authParams);
    return await integrationManager.createIntegration(params);
  }

  @Get("/")
  public async getIntegrations(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Array<Integration>, string>> {
    const integrationManager = new IntegrationManager(request.authParams);
    const result = await integrationManager.getIntegrations();
    if (result.error || !result.data) {
      return result;
    }
    return ok(result.data.map((integration) => redactIntegration(integration)));
  }

  @Post("/{integrationId}")
  public async updateIntegration(
    @Path() integrationId: string,
    @Body() params: IntegrationUpdateParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    if (!isJwtOrgAdmin(request.authParams)) {
      this.setStatus(403);
      return err(INTEGRATION_FORBIDDEN_MESSAGE);
    }
    const integrationManager = new IntegrationManager(request.authParams);
    return await integrationManager.updateIntegration(integrationId, params);
  }

  @Get("/{integrationId}")
  public async getIntegration(
    @Path() integrationId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Integration, string>> {
    const integrationManager = new IntegrationManager(request.authParams);
    return redactResult(await integrationManager.getIntegration(integrationId));
  }

  @Get("/type/{type}")
  public async getIntegrationByType(
    @Path() type: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Integration, string>> {
    const integrationManager = new IntegrationManager(request.authParams);
    return redactResult(await integrationManager.getIntegrationByType(type));
  }

  @Get("/slack/settings")
  public async getSlackSettings(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Integration, string>> {
    const integrationManager = new IntegrationManager(request.authParams);
    return redactResult(await integrationManager.getIntegrationByType("slack"));
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
    if (!isJwtOrgAdmin(request.authParams)) {
      this.setStatus(403);
      return err(INTEGRATION_FORBIDDEN_MESSAGE);
    }
    if (
      typeof body?.event_name !== "string" ||
      typeof body?.customer_id !== "string" ||
      body.event_name.length === 0 ||
      body.customer_id.length === 0 ||
      body.event_name.length > 200 ||
      body.customer_id.length > 200
    ) {
      this.setStatus(400);
      return err("event_name and customer_id are required");
    }
    if (!consumeTestMeterEventQuota(request.authParams.organizationId)) {
      this.setStatus(429);
      return err("Too many test meter events. Please try again later.");
    }

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
