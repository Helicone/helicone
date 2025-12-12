import Stripe from "stripe";
import { StripeIntegrationManager } from "../../managers/stripe/StripeIntegrationManager";
import {
  PromiseGenericResult,
  Result,
  err,
  ok,
} from "../../packages/common/result";
import { KVCache } from "../cache/kvCache";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";
import { cacheResultCustom } from "../../utils/cacheResult";
import { IntegrationManager } from "../../managers/IntegrationManager";
import {
  mapHeliconeModelToStripe,
  isModelSupportedInStripe,
  getAllSupportedStripeModels,
  // Legacy exports for backward compatibility
  mapModelToStripeFormat,
  isModelAvailableInStripe,
  getAvailableStripeModels,
} from "../../../../packages/cost/stripe-utils";

const DEFAULT_CACHE_REFERENCE_ID = "00000000-0000-0000-0000-000000000000";
type StripeMeterEvent = Stripe.V2.Billing.MeterEventStreamCreateParams.Event;

const cache = new KVCache(60 * 1000); // 1 minute

const getStripeIntegrationSettings = async (
  organizationId: string
): Promise<Result<{ event_name: string; active: boolean }, string>> => {
  const integrationManager = new IntegrationManager({
    organizationId: organizationId,
  });

  const integration = await integrationManager.getIntegrationByType("stripe");

  if (integration.error) {
    return err(`Error fetching stripe integration: ${integration.error}`);
  }

  if (!integration.data) {
    return err("Stripe integration not found");
  }

  let eventName = (integration.data.settings as any)?.event_name;
  if (!eventName) {
    return err("Stripe integration not found");
  }

  return ok({
    event_name: eventName,
    active: integration.data.active || false,
  });
};

export class StripeIntegrationHandler extends AbstractLogHandler {
  // organization_id to events mapping
  private stripeTraceUsages: Record<string, StripeMeterEvent[]> = {};
  private readonly maxEventsPerBatch = 1000; // Stripe API limit per organization
  constructor() {
    super();
  }

  public async handle(context: HandlerContext): PromiseGenericResult<string> {
    const start = performance.now();
    context.timingMetrics.push({
      constructor: this.constructor.name,
      start,
    });
    const organizationId = context.authParams?.organizationId;
    if (!organizationId) {
      return await super.handle(context);
    }

    if (
      context.message.log.request.cacheReferenceId &&
      context.message.log.request.cacheReferenceId !==
        DEFAULT_CACHE_REFERENCE_ID
    ) {
      context.processedLog.request.properties = {
        ...(context.processedLog.request.properties || {}),
        "helicone-stripe-integration-status": "skipped",
        "helicone-stripe-skip-reason": "cache-hit",
      };
      return await super.handle(context);
    }

    // Get Stripe integration settings
    const integrationSettings = await cacheResultCustom(
      "stripe_integration_settings_" + organizationId,
      async () => getStripeIntegrationSettings(organizationId),
      cache
    );

    if (
      integrationSettings.error ||
      !integrationSettings.data ||
      !integrationSettings.data.active
    ) {
      return await super.handle(context);
    }

    // Get Stripe customer ID from request properties (passed via x-stripe-customer-id header)
    const stripeCustomerId = context.message.heliconeMeta.stripeCustomerId;

    if (!stripeCustomerId) {
      // Skip processing if no Stripe customer ID provided
      context.processedLog.request.properties = {
        ...(context.processedLog.request.properties || {}),
        "helicone-stripe-integration-status": "skipped",
        "helicone-stripe-skip-reason": "no-customer-id",
      };
      return await super.handle(context);
    }

    // Get token counts and model information with validation
    const promptTokens = Math.max(0, Math.floor(context.usage?.input || 0));

    const completionTokens = Math.max(
      0,
      Math.floor(context.usage?.output || 0)
    );

    // Validate and sanitize model and provider names
    const rawModel =
      context.processedLog?.request?.model ||
      context.processedLog?.model ||
      "unknown";
    const rawProvider = context.message.log.request.provider || "unknown";

    const model = typeof rawModel === "string" ? rawModel.trim() : "unknown";
    let provider =
      typeof rawProvider === "string"
        ? rawProvider.trim().toLowerCase()
        : "unknown";

    // quick patch
    if (provider === "azure") {
      provider = "openai";
    }

    // Sanitize model and provider strings to prevent injection attacks
    const sanitizedModel = model
      .replace(/[^a-zA-Z0-9_\-\/\.]/g, "")
      .substring(0, 50);
    const sanitizedProvider = provider
      .replace(/[^a-zA-Z0-9_\-]/g, "")
      .substring(0, 20);

    // Format model as "provider/model" with validation
    const formattedModel = `${sanitizedProvider}/${sanitizedModel}`.substring(
      0,
      100
    ); // Limit length

    // Map internal model format to Stripe format (dots -> hyphens for version numbers)
    const stripeModel = mapHeliconeModelToStripe(formattedModel);

    if (!stripeModel) {
      context.processedLog.request.properties = {
        ...(context.processedLog.request.properties || {}),
        "helicone-stripe-integration-status": "skipped",
        "helicone-stripe-skip-reason": "model-not-whitelisted",
        "helicone-stripe-attempted-model": formattedModel,
      };
      return await super.handle(context);
    }

    // Initialize organization array if it doesn't exist
    if (!this.stripeTraceUsages[organizationId]) {
      this.stripeTraceUsages[organizationId] = [];
    }

    // Prevent memory growth by limiting array size per organization
    if (
      this.stripeTraceUsages[organizationId].length >= this.maxEventsPerBatch
    ) {
      context.processedLog.request.properties = {
        ...(context.processedLog.request.properties || {}),
        "helicone-stripe-integration-status": "skipped",
        "helicone-stripe-skip-reason": "max-events-exceeded",
        "helicone-stripe-event-count":
          this.stripeTraceUsages[organizationId].length.toString(),
      };
      return await super.handle(context);
    }

    // Create events for prompt tokens (input)
    if (promptTokens > 0) {
      const promptEvent: StripeMeterEvent = {
        identifier: `org_${organizationId}_request_${context.message.log.request.id}_prompt`,
        event_name: integrationSettings.data.event_name,
        timestamp: context.message.log.request.requestCreatedAt.toISOString(),
        payload: {
          stripe_customer_id: stripeCustomerId,
          value: promptTokens.toString(),
          token_type: "input",
          model: stripeModel,
        },
      };
      this.stripeTraceUsages[organizationId].push(promptEvent);
    }

    // Create events for completion tokens (output)
    if (completionTokens > 0) {
      // Use response timestamp for completion events for accurate billing timing
      const completionTimestamp = context.message.log.response
        ?.responseCreatedAt
        ? context.message.log.response.responseCreatedAt.toISOString()
        : context.message.log.request.requestCreatedAt.toISOString();

      const completionEvent: StripeMeterEvent = {
        identifier: `org_${organizationId}_request_${context.message.log.request.id}_completion`,
        event_name: integrationSettings.data.event_name,
        timestamp: completionTimestamp,
        payload: {
          stripe_customer_id: stripeCustomerId,
          value: completionTokens.toString(),
          token_type: "output",
          model: stripeModel,
        },
      };
      this.stripeTraceUsages[organizationId].push(completionEvent);
    }

    // Handle zero tokens case
    if (promptTokens === 0 && completionTokens === 0) {
      context.processedLog.request.properties = {
        ...(context.processedLog.request.properties || {}),
        "helicone-stripe-integration-status": "skipped",
        "helicone-stripe-skip-reason": "zero-tokens",
      };
    } else {
      // Successfully processed - add success properties
      context.processedLog.request.properties = {
        ...(context.processedLog.request.properties || {}),
        "helicone-stripe-integration-status": "processed",
        "helicone-stripe-customer-id": stripeCustomerId,
        "helicone-stripe-model": stripeModel,
      };
    }

    return await super.handle(context);
  }

  public async handleResults(): PromiseGenericResult<string> {
    const organizationIds = Object.keys(this.stripeTraceUsages);

    if (organizationIds.length === 0) {
      return ok("No stripe meter events to process");
    }

    const results: string[] = [];
    const errors: string[] = [];
    let totalProcessed = 0;
    let totalEvents = 0;

    try {
      // Process each organization independently
      for (const organizationId of organizationIds) {
        const events = this.stripeTraceUsages[organizationId];
        totalEvents += events.length;

        if (events.length === 0) {
          // Clear empty organization arrays immediately
          delete this.stripeTraceUsages[organizationId];
          continue;
        }

        try {
          const stripeIntegrationManager = new StripeIntegrationManager({
            organizationId: organizationId,
          });

          const result = await stripeIntegrationManager.sendMeterEvents(events);

          if (result.error) {
            errors.push(`Org ${organizationId}: ${result.error}`);
          } else {
            results.push(`Org ${organizationId}: ${result.data}`);
            totalProcessed += events.length;
          }

          // Clear processed organization data immediately after processing
          // to prevent memory accumulation across batches
          delete this.stripeTraceUsages[organizationId];
        } catch (orgError) {
          errors.push(`Org ${organizationId}: Unexpected error - ${orgError}`);
          // Clear failed organization data to prevent retry accumulation
          delete this.stripeTraceUsages[organizationId];
        }
      }

      // Generate summary result
      if (errors.length > 0 && results.length === 0) {
        // All organizations failed
        return err(
          `Failed to process events for all organizations. Errors: ${errors.join("; ")}`
        );
      } else if (errors.length > 0) {
        // Partial success
        return err(
          `Processed ${totalProcessed}/${totalEvents} events. Successes: ${results.length} orgs, Failures: ${errors.length} orgs. Errors: ${errors.join("; ")}`
        );
      } else {
        // All successful
        return ok(
          `Successfully processed ${totalProcessed} stripe meter events across ${results.length} organizations`
        );
      }
    } catch (error) {
      return err(`Unexpected error processing stripe meter events: ${error}`);
    } finally {
      // Final cleanup - ensure all organization data is cleared
      // This is a safety net in case individual deletions failed
      this.stripeTraceUsages = {};
    }
  }
}
