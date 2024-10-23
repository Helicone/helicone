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
    return ok("DISABLED FOR NOW");
  }

  async handleResults(): PromiseGenericResult<string> {
    return ok("DISABLED FOR NOW");
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
    console.log(crypto.randomUUID());
    return ok(`NO IMPLEMENTATION`);
  }
}
