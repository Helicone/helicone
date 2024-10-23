import { Database } from "../db/database.types";
import { createHmac } from "crypto";
import { PromiseGenericResult, ok } from "../shared/result";

export type WebhookPayload = {
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

export async function sendToWebhook(
  payload: WebhookPayload["payload"],
  webhook: Database["public"]["Tables"]["webhooks"]["Row"]
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

    const MAX_BODY_SIZE = 10 * 1024; // 10 KB limit
    const truncateBody = (body: string): string =>
      body.length > MAX_BODY_SIZE
        ? "Body too large for webhook, please fetch the full request and response from Helicone"
        : body;

    const hmac = createHmac("sha256", hmacKey);

    const webHoookPayload = JSON.stringify({
      request_id: payload.request.id,
      request_body: truncateBody(payload.request.body),
      response_body: truncateBody(payload.response.body),
    });
    hmac.update(webHoookPayload);

    const hash = hmac.digest("hex");

    if (!webhook.destination.startsWith("https://")) {
      return ok(`Skipping webhook due to destination`);
    }

    await fetch(webhook.destination, {
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
