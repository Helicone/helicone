import { modelCost } from "@helicone-package/cost/costCalc";
import {
  HeliconeRequestResponseToPosthog,
  PostHogEvent,
  PosthogUserClient,
} from "../clients/PosthogUserClient";
import { PromiseGenericResult, ok } from "../../packages/common/result";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";
import crypto from "crypto";
import * as Sentry from "@sentry/node";

export class PostHogHandler extends AbstractLogHandler {
  private posthogEvents: PostHogEvent[] = [];

  constructor() {
    super();
  }

  public async handle(context: HandlerContext): PromiseGenericResult<string> {
    const start = performance.now();
    context.timingMetrics.push({
      constructor: this.constructor.name,
      start,
    });
    if (!context.message.heliconeMeta.posthogApiKey) {
      return await super.handle(context);
    }

    const posthogProperties = this.mapPostHogLog(context);

    this.posthogEvents.push({
      apiKey: context.message.heliconeMeta.posthogApiKey,
      host: context.message.heliconeMeta.posthogHost,
      properties: posthogProperties,
      createdAt: context.message.log.request.requestCreatedAt,
    });

    return await super.handle(context);
  }

  public async handleResults(): PromiseGenericResult<string> {
    this.posthogEvents.forEach((event) => {
      try {
        const posthogClient = new PosthogUserClient(event.apiKey, event.host);

        // Use Helicone-User-Id as distinct_id if available, else fallback to random UUID
        const distinctId =
          event.properties.userId && event.properties.userId.trim() !== ""
            ? event.properties.userId
            : crypto.randomUUID();

        posthogClient.captureEvent(
          "helicone_request_response",
          event.properties,
          event.createdAt,
          distinctId,
        );
      } catch (error: any) {
        Sentry.captureException(new Error(JSON.stringify(error)), {
          tags: {
            type: "WebhookError",
            topic: "request-response-logs-prod",
          },
        });
      }
    });

    return ok("Posthog events sent");
  }

  mapPostHogLog(context: HandlerContext): HeliconeRequestResponseToPosthog {
    const request = context.message.log.request;
    const response = context.message.log.response;
    const model = context.processedLog.model;
    const reqBody = context.processedLog.request.body;
    const legacyUsage = context.legacyUsage;
    const modelUsage = context.usage;

    const promptTokens = modelUsage?.input ?? legacyUsage.promptTokens ?? 0;
    const completionTokens =
      modelUsage?.output ?? legacyUsage.completionTokens ?? 0;
    const totalTokens = promptTokens + completionTokens;

    const posthogLog: HeliconeRequestResponseToPosthog = {
      model: model ?? "",
      temperature: reqBody.temperature ?? 0.0,
      n: reqBody.n ?? 0,
      promptId: request.promptId ?? "",
      timeToFirstToken: response.timeToFirstToken ?? 0,
      cost: context.costBreakdown?.totalCost ?? legacyUsage.cost ?? 0,
      provider: request.provider ?? "",
      path: request.path ?? "",
      completetionTokens: completionTokens,
      promptTokens,
      totalTokens,
      userId: request.userId ?? "",
      countryCode: request.countryCode ?? "",
      requestBodySize: request.bodySize ?? 0,
      responseBodySize: response.bodySize ?? 0,
      delayMs: response.delayMs ?? 0,
      heliconeBackLink: `https://www.helicone.ai/requests?requestId=${request.id}`,
      customProperties: Object.entries(request.properties).reduce(
        (acc, [key, value]) => {
          if (key.toLowerCase() === "Helicone-Sent-To-Posthog".toLowerCase()) {
            return acc;
          }

          acc[key] = value;

          return acc;
        },
        {} as Record<string, string>,
      ),
    };

    return posthogLog;
  }
}
