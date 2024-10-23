import { ENVIRONMENT } from "../..";
import { Database } from "../db/database.types";
import { PromiseGenericResult, err, ok } from "../shared/result";
import { FeatureFlagStore } from "../stores/FeatureFlagStore";
import { WebhookStore } from "../stores/WebhookStore";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";
import * as Sentry from "@sentry/node";

import crypto from "crypto";

type WebhookPayload = {
  payload: {
    request: {
      id: string;
      body: string;
    };
    response: {
      body: string;
    };
    properties: Record<string, string>;
  };
  webhook: Database["public"]["Tables"]["webhooks"]["Row"];
  orgId: string;
};

export class WebhookHandler extends AbstractLogHandler {
  private webhookStore: WebhookStore;
  private featureFlagStore: FeatureFlagStore;
  private webhookPayloads: WebhookPayload[] = [];

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

    await Promise.all(
      this.webhookPayloads.map(async (webhookPayload) => {
        try {
          return await this.sendToWebhook(
            webhookPayload.payload,
            webhookPayload.webhook,
            webhookPayload.orgId
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

  async sendToWebhook(
    payload: {
      request: {
        id: string;
        body: string;
      };
      response: {
        body: string;
      };
      properties: Record<string, string>;
    },
    webhook: Database["public"]["Tables"]["webhooks"]["Row"],
    orgId: string
  ): PromiseGenericResult<string> {
    try {
      const hmacKey = webhook.hmac_key ?? "";

      const sampleRate = (webhook.config as any)?.["sampleRate"] ?? 100;

      if (Math.random() > (sampleRate * 1.0) / 100) {
        return ok(`Skipping webhook due to sample rate`);
      }

      const propertyFilters = ((webhook.config as any)?.["propertyFilters"] ??
        []) as {
        key: string;
        value: string;
      }[];

      const shouldWebhookProperties = propertyFilters.every(
        (propertyFilter) =>
          payload.properties[propertyFilter.key] === propertyFilter.value
      );

      if (!shouldWebhookProperties) {
        return ok(`Skipping webhook due to property filter`);
      }

      const hmac = crypto.createHmac("sha256", hmacKey);
      const webHoookPayload = JSON.stringify({
        request_id: payload.request.id,
        request_body: payload.request.body,
        response_body: payload.response.body,
      });
      hmac.update(webHoookPayload);

      const hash = hmac.digest("hex");

      if (
        !webhook.destination.startsWith("https://") &&
        ENVIRONMENT !== "development"
      ) {
        return ok(`Skipping webhook due to destination`);
      }

      fetch(webhook.destination, {
        method: "POST",
        body: webHoookPayload,
        headers: {
          "Content-Type": "application/json",
          "Helicone-Signature": hash,
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error sending to webhook", error.message);
    }

    return ok(`Successfully sent to webhook`);
  }
}
