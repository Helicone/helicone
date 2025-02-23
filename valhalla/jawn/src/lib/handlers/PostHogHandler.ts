import { costOfPrompt } from "../../packages/cost";
import {
  HeliconeRequestResponseToPosthog,
  PostHogEvent,
  PosthogUserClient,
} from "../clients/PosthogUserClient";
import { PromiseGenericResult, ok } from "../shared/result";
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
    if (!context.message.heliconeMeta.posthogApiKey) {
      return await super.handle(context);
    }

    const usage = context.usage;

    const cost = this.modelCost({
      model: context.processedLog.model ?? "",
      provider: context.message.log.request.provider ?? "",
      sum_prompt_tokens: usage.promptTokens ?? 0,
      sum_completion_tokens: usage.completionTokens ?? 0,
      sum_tokens: (usage.promptTokens ?? 0) + (usage.completionTokens ?? 0),
    });

    context.usage.cost = cost;

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

        posthogClient.captureEvent(
          "helicone_request_response",
          event.properties,
          event.createdAt,
          crypto.randomUUID()
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
    const usage = context.usage;

    const posthogLog: HeliconeRequestResponseToPosthog = {
      model: model ?? "",
      temperature: reqBody.temperature ?? 0.0,
      n: reqBody.n ?? 0,
      promptId: request.promptId ?? "",
      timeToFirstToken: response.timeToFirstToken ?? 0,
      cost: usage.cost ?? 0,
      provider: request.provider ?? "",
      path: request.path ?? "",
      completetionTokens: usage.completionTokens ?? 0,
      promptTokens: usage.promptTokens ?? 0,
      totalTokens: (usage.completionTokens ?? 0) + (usage.promptTokens ?? 0),
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
        {} as Record<string, string>
      ),
    };

    return posthogLog;
  }

  modelCost(modelRow: {
    model: string;
    provider: string;
    sum_prompt_tokens: number;
    sum_completion_tokens: number;
    sum_tokens: number;
  }): number {
    const model = modelRow.model;
    const promptTokens = modelRow.sum_prompt_tokens;
    const completionTokens = modelRow.sum_completion_tokens;
    return (
      costOfPrompt({
        model,
        promptTokens,
        completionTokens,
        provider: modelRow.provider,
        promptCacheWriteTokens: 0,
        promptCacheReadTokens: 0,
      }) ?? 0
    );
  }
}
