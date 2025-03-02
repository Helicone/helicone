import { Database } from "../db/database.types";
import { createHmac } from "crypto";
import { PromiseGenericResult, ok } from "../shared/result";
import { S3Client } from "../shared/db/s3Client";
import { modelCost } from "../../packages/cost/costCalc";
import { WebhookConfig } from "../shared/types";

export type WebhookPayload = {
  payload: {
    signedUrl?: string;
    request: {
      id: string;
      body: string;
      model?: string;
      provider?: string;
      user_id?: string;
    };
    response: {
      body: string;
    };
    properties: Record<string, string>;
    metadata?: {
      cost?: number;
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
      latencyMs?: number;
    };
  };
  webhook: Database["public"]["Tables"]["webhooks"]["Row"];
  orgId: string;
};

type WebhookData = {
  request_id: string;
  request_body: string;
  response_body: string;
  user_id?: string;
  request_response_url?: string;
  model?: string;
  provider?: string;
  metadata?: {
    cost?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    latencyMs?: number;
  };
};

export async function sendToWebhook(
  payload: WebhookPayload["payload"],
  webhook: Database["public"]["Tables"]["webhooks"]["Row"]
): PromiseGenericResult<string> {
  try {
    const hmacKey = webhook.hmac_key ?? "";
    const config = (webhook.config as WebhookConfig) || {};
    const sampleRate = Number(config.sampleRate ?? 100);
    const includeData = config.includeData !== false;

    if (isNaN(sampleRate) || sampleRate < 0 || sampleRate > 100) {
      return ok(`Skipping webhook due to invalid sample rate`);
    }

    if (Math.random() * 100 > sampleRate) {
      return ok(`Skipping webhook due to sample rate`);
    }

    const propertyFilters = config.propertyFilters ?? [];

    const shouldWebhookProperties = propertyFilters.every(
      (propertyFilter) =>
        payload.properties[propertyFilter.key] === propertyFilter.value
    );

    if (!shouldWebhookProperties) {
      return ok(`Skipping webhook due to property filter`);
    }

    if (
      !webhook.destination ||
      typeof webhook.destination !== "string" ||
      !webhook.destination.startsWith("https://")
    ) {
      return ok(`Skipping webhook due to invalid destination`);
    }

    const MAX_BODY_SIZE = 10 * 1024; // 10 KB limit
    const truncateBody = (body: string): string =>
      typeof body === "string" && body.length > MAX_BODY_SIZE
        ? "Body too large for webhook, please fetch the full request and response from Helicone"
        : body;

    // Create the base webhook payload
    const webHookPayloadObj: WebhookData = {
      request_id: payload.request.id,
      request_body: truncateBody(payload.request.body),
      response_body: truncateBody(payload.response.body),
    };

    // Add user_id if available
    if (payload.request.user_id) {
      webHookPayloadObj.user_id = payload.request.user_id;
    }

    // Add additional data if includeData is true
    if (includeData) {
      // Add S3 URL if available - this URL contains both request and response data
      if (payload.signedUrl) {
        webHookPayloadObj.request_response_url = payload.signedUrl;
      }

      // Add model and provider if available
      if (payload.request.model) {
        webHookPayloadObj.model = payload.request.model;
      }

      if (payload.request.provider) {
        webHookPayloadObj.provider = payload.request.provider;
      }

      // Add metadata if available
      if (payload.metadata) {
        webHookPayloadObj.metadata = payload.metadata;
      }
    }

    const webHookPayload = JSON.stringify(webHookPayloadObj);

    const hmac = createHmac("sha256", hmacKey);
    hmac.update(webHookPayload);
    const hash = hmac.digest("hex");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2 * 60 * 1000);

    try {
      const response = await fetch(webhook.destination, {
        method: "POST",
        body: webHookPayload,
        headers: {
          "Content-Type": "application/json",
          "Helicone-Signature": hash,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Webhook request failed with status ${response.status}`
        );
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Webhook request timed out after 2 minutes");
      return ok("Failed to send webhook: Request timed out after 2 minutes");
    }
    console.error(
      "Error sending to webhook",
      error instanceof Error ? error.message : String(error)
    );
    return ok(
      `Failed to send webhook: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  return ok(`Successfully sent to webhook`);
}
