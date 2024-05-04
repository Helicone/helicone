import { Database } from "../db/database.types";
import { PromiseGenericResult, err, ok } from "../shared/result";
import { FeatureFlagStore } from "../stores/FeatureFlagStore";
import { WebhookStore } from "../stores/WebhookStore";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";

export class WebhookHandler extends AbstractLogHandler {
  private webhookStore: WebhookStore;
  private featureFlagStore: FeatureFlagStore;

  constructor(webhookStore: WebhookStore, featureFlagStore: FeatureFlagStore) {
    super();
    this.webhookStore = webhookStore;
    this.featureFlagStore = featureFlagStore;
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
      const res = await this.sendToWebhook(
        {
          request: {
            id: context.message.log.request.id,
            body: context.processedLog.request.body,
          },
          response: {
            body: context.processedLog.response.body,
          },
        },
        webhook,
        orgId
      );

      if (res.error) {
        return err(res.error);
      }
    }

    return await super.handle(context);
  }

  async sendToWebhook(
    payload: {
      request: {
        id: string;
        body: string;
      };
      response: {
        body: string;
      };
    },
    webhook: Database["public"]["Tables"]["webhooks"]["Row"],
    orgId: string
  ): PromiseGenericResult<undefined> {
    // Check FF
    const webhookFF = await this.featureFlagStore.getFeatureFlagByOrgId(
      "webhook_beta",
      orgId
    );

    if (webhookFF.error || !webhookFF.data) {
      return err(
        `Error checking webhook ff or webhooks not enabled for user trying to use them, ${webhookFF.error}`
      );
    }

    const subscriptions =
      await this.webhookStore.getWebhookSubscriptionByWebhookId(webhook.id);

    if (subscriptions.error || !subscriptions.data) {
      return err(`Error getting webhook subscriptions, ${subscriptions.error}`);
    }

    const shouldSend =
      webhook.destination.includes("helicone-scoring-webhook") ||
      subscriptions.data
        .map((subscription) => {
          return subscription.event === "beta";
        })
        .filter((x) => x).length > 0;

    if (shouldSend) {
      console.log("SENDING", webhook.destination, payload.request.id);
      try {
        await fetch(webhook.destination, {
          method: "POST",
          body: JSON.stringify({
            request_id: payload.request.id,
            request_body: payload.request.body,
            response_body: payload.response.body,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Error sending to webhook", error.message);
      }
    }

    return ok(undefined);
  }
}
