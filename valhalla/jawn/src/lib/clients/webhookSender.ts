import { Database } from "../db/database.types";
import { createHmac } from "crypto";
import { PromiseGenericResult, ok, err } from "../../packages/common/result";
import { WebhookConfig } from "../shared/types";
import { randomUUID } from "crypto";

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

    // sleep for 30 seconds before sending the webhook to allow for the request to be logged in clickhouse
    await new Promise((resolve) => setTimeout(resolve, 30_000));

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
    return ok(
      `Failed to send webhook: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  return ok(`Successfully sent to webhook`);
}

// Generate mock data for testing webhooks
function generateMockWebhookData(): WebhookData {
  const requestId = randomUUID();
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Mock OpenAI chat completion request
  const requestBody = {
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: "test message"
      }
    ]
  };

  // Mock OpenAI chat completion response
  const responseBody = {
    id: `chatcmpl-${randomUUID().substring(0, 29)}`,
    object: "chat.completion",
    created: timestamp,
    model: "gpt-4o-2024-08-06",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: "Hey! Not much, just here to help you out. What's up with you?",
          refusal: null,
          annotations: []
        },
        logprobs: null,
        finish_reason: "stop"
      }
    ],
    usage: {
      prompt_tokens: 13,
      completion_tokens: 17,
      total_tokens: 30,
      prompt_tokens_details: {
        cached_tokens: 0,
        audio_tokens: 0
      },
      completion_tokens_details: {
        reasoning_tokens: 0,
        audio_tokens: 0,
        accepted_prediction_tokens: 0,
        rejected_prediction_tokens: 0
      }
    },
    service_tier: "default",
    system_fingerprint: `fp_${randomUUID().substring(0, 14)}`
  };

  // Generate mock S3 URL with AWS signature
  const s3Url = `https://s3.us-west-2.amazonaws.com/request-response-storage/organizations/${randomUUID()}/requests/${requestId}/request_response_body?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=MOCKAWSCREDENTIAL%2F${new Date().toISOString().split('T')[0].replace(/-/g, '')}%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=${new Date().toISOString().replace(/[:-]/g, '').split('.')[0]}Z&X-Amz-Expires=86400&X-Amz-Security-Token=MockSecurityToken&X-Amz-Signature=mocksignature123456789&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject`;

  return {
    request_id: requestId,
    request_body: JSON.stringify(requestBody),
    response_body: JSON.stringify(responseBody),
    request_response_url: s3Url,
    model: "gpt-4o-2024-08-06",
    provider: "OPENAI",
    metadata: {
      cost: 0.00020250000000000002,
      promptTokens: 13,
      completionTokens: 17,
      totalTokens: 30,
      latencyMs: 930
    }
  };
}

// Test webhook sender without delay
export async function sendTestWebhook(
  webhook: {
    id: string;
    destination: string;
    config: string | any;
    hmac_key: string;
  }
): PromiseGenericResult<string> {
  try {
    const hmacKey = webhook.hmac_key ?? "";
    let config: WebhookConfig;
    
    // Handle both string and object configs (database might return either)
    if (typeof webhook.config === 'string') {
      try {
        config = (JSON.parse(webhook.config) as WebhookConfig) || {};
      } catch (parseError) {
        return err(`Failed to parse webhook config: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
      }
    } else {
      config = (webhook.config as WebhookConfig) || {};
    }
    
    const includeData = config.includeData !== false;

    if (
      !webhook.destination ||
      typeof webhook.destination !== "string" ||
      !webhook.destination.startsWith("https://")
    ) {
      return err(`Invalid destination URL. Must start with https://`);
    }

    // Generate mock data
    const mockData = generateMockWebhookData();
    
    // Create webhook payload based on includeData setting
    const webHookPayloadObj: WebhookData = {
      request_id: mockData.request_id,
      request_body: mockData.request_body,
      response_body: mockData.response_body,
    };

    // Add additional data if includeData is true
    if (includeData) {
      webHookPayloadObj.request_response_url = mockData.request_response_url;
      webHookPayloadObj.model = mockData.model;
      webHookPayloadObj.provider = mockData.provider;
      webHookPayloadObj.metadata = mockData.metadata;
    }

    const webHookPayload = JSON.stringify(webHookPayloadObj);

    // Generate HMAC signature
    const hmac = createHmac("sha256", hmacKey);
    hmac.update(webHookPayload);
    const hash = hmac.digest("hex");

    // Set a shorter timeout for test webhooks (10 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10 * 1000);

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
          `Webhook test failed with status ${response.status}: ${response.statusText}`
        );
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      return err("Test webhook request timed out after 10 seconds");
    }
    return err(
      `Test webhook failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  return ok(`Test webhook sent successfully`);
}
