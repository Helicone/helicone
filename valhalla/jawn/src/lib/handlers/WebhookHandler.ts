import * as Sentry from "@sentry/node";
import { sendToWebhook, WebhookPayload } from "../clients/webhookSender";
import { err, ok, PromiseGenericResult } from "../shared/result";
import { FeatureFlagStore } from "../stores/FeatureFlagStore";
import { WebhookStore } from "../stores/WebhookStore";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";

export class WebhookHandler extends AbstractLogHandler {
  private webhookStore: WebhookStore;

  private webhookPayloads: WebhookPayload[] = [];

  constructor(webhookStore: WebhookStore) {
    super();
    this.webhookStore = webhookStore;
  }

  async handle(context: HandlerContext): PromiseGenericResult<string> {
    const orgId = context.orgParams?.id;

    if (!orgId) {
      return err(`Org ID not found in context`);
    }

    const webhooks = await this.webhookStore.getWebhooksByOrgId(orgId);

    if (webhooks.error) {
      return err(webhooks.error);
    }

    for (const webhook of webhooks.data ?? []) {
      this.webhookPayloads.push({
        payload: {
          request: {
            id: context.message.log.request.id,
            body: context.processedLog.request.body,
          },
          response: {
            body: context.processedLog.response.body,
          },
          properties: context.processedLog.request.properties ?? {},
        },
        webhook: webhook,
        orgId,
      });
    }

    return await super.handle(context);
  }

  async handleResults(): PromiseGenericResult<string> {
    if (this.webhookPayloads.length === 0) {
      return ok("No webhooks to send");
    }

    console.log("Preparing to send webhooks, delaying for 10 seconds...");

    // Add a delay to ensure database operations are complete
    await new Promise((resolve) => setTimeout(resolve, 10000));

    console.log("Sending to webhooks: ", this.webhookPayloads.length);

    await Promise.all(
      this.webhookPayloads.map(async (webhookPayload) => {
        try {
          return await sendToWebhook(
            webhookPayload.payload,
            webhookPayload.webhook
          );
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
      })
    );

    return ok(`Successfully sent to webhooks`);
  }
}
