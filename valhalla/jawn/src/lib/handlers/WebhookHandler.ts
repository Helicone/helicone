import * as Sentry from "@sentry/node";
import { sendToWebhook, WebhookPayload } from "../clients/webhookSender";
import { err, ok, PromiseGenericResult } from "../../packages/common/result";
import { WebhookStore } from "../stores/WebhookStore";
import { AbstractLogHandler } from "./AbstractLogHandler";
import {
  getCompletionTokens,
  getPromptTokens,
  HandlerContext,
} from "./HandlerContext";
import { S3Client } from "../shared/db/s3Client";
import { WebhookConfig } from "../shared/types";

export class WebhookHandler extends AbstractLogHandler {
  private webhookStore: WebhookStore;
  private s3Client: S3Client;
  private webhookPayloads: WebhookPayload[] = [];

  constructor(webhookStore: WebhookStore) {
    super();
    this.webhookStore = webhookStore;
    this.s3Client = new S3Client(
      process.env.S3_ACCESS_KEY || undefined,
      process.env.S3_SECRET_KEY || undefined,
      process.env.S3_ENDPOINT ?? "",
      process.env.S3_BUCKET_NAME ?? "",
      (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2",
    );
  }

  async handle(context: HandlerContext): PromiseGenericResult<string> {
    const start = performance.now();
    context.timingMetrics.push({
      constructor: this.constructor.name,
      start,
    });
    const orgId = context.orgParams?.id;

    if (!orgId) {
      return err(`Org ID not found in context`);
    }

    const webhooks = await this.webhookStore.getWebhooksByOrgId(orgId);

    if (webhooks.error) {
      return err(webhooks.error);
    }

    for (const webhook of webhooks.data ?? []) {
      // Check if we should include additional data
      const config = (webhook.config as WebhookConfig) || {};
      const includeData = config.includeData !== false;

      // Calculate cost if needed
      let metadata = undefined;
      if (includeData) {
        const model =
          context.processedLog.model ?? context.processedLog.request.model;

        if (model) {
          const cost =
            context.costBreakdown?.totalCost ?? context.legacyUsage.cost ?? 0;
          const promptTokens =
            getPromptTokens(context.usage, context.legacyUsage) ?? 0;
          const completionTokens =
            getCompletionTokens(context.usage, context.legacyUsage) ?? 0;
          const totalTokens = promptTokens + completionTokens;

          // Calculate latency
          const latencyMs = context.message.log.response.delayMs;

          metadata = {
            cost,
            promptTokens,
            completionTokens,
            totalTokens,
            latencyMs,
          };
        }
      }

      // Get the signed URL once if includeData is enabled
      const signedUrl = includeData
        ? await this.getSignedUrl(context.message.log.request.id, orgId)
        : undefined;

      this.webhookPayloads.push({
        payload: {
          signedUrl,
          request: {
            id: context.message.log.request.id,
            body: context.processedLog.request.body,

            model: includeData
              ? (context.processedLog.model ??
                context.processedLog.request.model)
              : undefined,
            provider: includeData
              ? context.message.log.request.provider
              : undefined,
            user_id: context.message.log.request.userId,
          },
          response: {
            body: context.processedLog.response.body,
          },
          properties: context.processedLog.request.properties ?? {},
          metadata: includeData ? metadata : undefined,
        },
        webhook: webhook,
        orgId,
      });
    }

    return await super.handle(context);
  }

  private async getSignedUrl(
    requestId: string,
    orgId: string,
  ): Promise<string | undefined> {
    try {
      const result = await this.s3Client.getRequestResponseBodySignedUrl(
        orgId,
        requestId,
      );
      return result.data || undefined;
    } catch (error) {
      console.error(
        `Error getting signed URL for request ${requestId}:`,
        error,
      );
      return undefined;
    }
  }

  async handleResults(): PromiseGenericResult<string> {
    if (this.webhookPayloads.length === 0) {
      return ok("No webhooks to send");
    }

    await Promise.all(
      this.webhookPayloads.map(async (webhookPayload) => {
        try {
          // Ensure we're sending the most up-to-date data
          const result = await sendToWebhook(
            webhookPayload.payload,
            webhookPayload.webhook,
          );

          if (result.error) {
            console.error("Error sending webhook:", result.error);
          }
        } catch (error: any) {
          Sentry.captureException(error, {
            tags: {
              type: "WebhookError",
              topic: "request-response-logs-prod",
            },
            extra: {
              orgId: webhookPayload.orgId,
              webhook: webhookPayload.webhook,
            },
          });
        }
      }),
    );

    return ok(`Successfully sent to webhooks`);
  }
}
