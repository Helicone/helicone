import { Database } from "../db/database.types";
import { createHmac } from "crypto";
import { PromiseGenericResult, ok, err } from "../../packages/common/result";
import { WebhookConfig } from "../shared/types";
import { randomUUID } from "crypto";

/**
 * Validates that a webhook destination URL does not point to private/internal networks.
 * Prevents SSRF attacks by blocking requests to localhost, private IPs, and metadata
 * endpoints, including obfuscated encodings (decimal/octal/hex/dotless IPv4, IPv6
 * literals, and IPv4-mapped IPv6 addresses).
 *
 * Exported for unit testing.
 */
export function isPrivateOrReservedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();

  // Reserved / internal hostnames
  if (
    lower === "localhost" ||
    lower === "ip6-localhost" ||
    lower === "ip6-loopback" ||
    lower === "metadata.google.internal"
  ) {
    return true;
  }
  if (
    lower.endsWith(".localhost") ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal") ||
    lower.endsWith(".corp") ||
    lower.endsWith(".lan")
  ) {
    return true;
  }

  // IPv6 literals. WHATWG URL keeps the surrounding brackets in `hostname`.
  if (lower.includes(":") || (lower.startsWith("[") && lower.endsWith("]"))) {
    return isPrivateIPv6(lower);
  }

  // IPv4 in any encoding (dotted-decimal, decimal, octal, hex, dotless).
  const v4 = parseIPv4Loose(lower);
  if (v4) {
    return isPrivateIPv4Octets(v4);
  }

  return false;
}

/**
 * Parses an IPv4 address in any of the encodings the URL/inet_aton family accepts:
 * dotted-decimal ("127.0.0.1"), decimal ("2130706433"), hex ("0x7f000001",
 * "0x7f.0.0.1"), octal ("0177.0.0.1") and dotless/short forms ("127.1").
 * Returns the four octets, or null if `host` is not a valid IPv4 literal.
 */
function parseIPv4Loose(host: string): number[] | null {
  const rawParts = host.split(".");
  if (rawParts.length < 1 || rawParts.length > 4) {
    return null;
  }

  const vals: number[] = [];
  for (const part of rawParts) {
    if (part.length === 0) {
      return null;
    }
    let n: number;
    if (/^0[x][0-9a-f]+$/.test(part)) {
      n = parseInt(part.slice(2), 16);
    } else if (/^0[0-7]+$/.test(part)) {
      n = parseInt(part, 8);
    } else if (/^(0|[1-9][0-9]*)$/.test(part)) {
      n = parseInt(part, 10);
    } else {
      return null;
    }
    if (!Number.isFinite(n) || n < 0) {
      return null;
    }
    vals.push(n);
  }

  const last = vals.length - 1;
  for (let i = 0; i < last; i++) {
    if (vals[i] > 255) {
      return null;
    }
  }
  // The final part absorbs all remaining octets (e.g. "127.1" -> 127.0.0.1).
  const maxLast = Math.pow(256, 4 - last) - 1;
  if (vals[last] > maxLast) {
    return null;
  }

  let addr = 0;
  for (let i = 0; i < last; i++) {
    addr += vals[i] * Math.pow(256, 3 - i);
  }
  addr += vals[last];
  if (addr < 0 || addr > 0xffffffff) {
    return null;
  }

  return [
    (addr >>> 24) & 0xff,
    (addr >>> 16) & 0xff,
    (addr >>> 8) & 0xff,
    addr & 0xff,
  ];
}

function isPrivateIPv4Octets(o: number[]): boolean {
  if (!o || o.length !== 4) {
    return false;
  }
  if (o.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return false;
  }
  // 0.0.0.0/8 (includes 0.0.0.0)
  if (o[0] === 0) return true;
  // 10.0.0.0/8
  if (o[0] === 10) return true;
  // 127.0.0.0/8 loopback
  if (o[0] === 127) return true;
  // 169.254.0.0/16 link-local (covers 169.254.169.254 metadata)
  if (o[0] === 169 && o[1] === 254) return true;
  // 172.16.0.0/12
  if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return true;
  // 192.168.0.0/16
  if (o[0] === 192 && o[1] === 168) return true;
  // 100.64.0.0/10 carrier-grade NAT
  if (o[0] === 100 && o[1] >= 64 && o[1] <= 127) return true;
  return false;
}

/**
 * Expands an IPv6 literal (with or without brackets, optional zone id, and optional
 * embedded IPv4 tail) into its eight 16-bit hextets. Returns null when the input is
 * not a valid IPv6 address.
 */
function expandIPv6(input: string): number[] | null {
  let s = input;
  if (s.startsWith("[") && s.endsWith("]")) {
    s = s.slice(1, -1);
  }
  const pct = s.indexOf("%");
  if (pct >= 0) {
    s = s.slice(0, pct);
  }
  if (s.indexOf(":") === -1) {
    return null;
  }

  // Embedded IPv4 tail, e.g. ::ffff:127.0.0.1
  let tailWords: number[] = [];
  const lastColon = s.lastIndexOf(":");
  const afterColon = s.slice(lastColon + 1);
  if (afterColon.indexOf(".") !== -1) {
    const v4 = parseIPv4Loose(afterColon);
    if (!v4) {
      return null;
    }
    tailWords = [(v4[0] << 8) | v4[1], (v4[2] << 8) | v4[3]];
    s = s.slice(0, lastColon + 1);
  }

  const dbl = s.indexOf("::");
  let head: string;
  let tail: string | null;
  if (dbl !== -1) {
    head = s.slice(0, dbl);
    tail = s.slice(dbl + 2);
  } else {
    head = s;
    tail = null;
  }

  const toWords = (str: string): number[] => {
    if (str === "") {
      return [];
    }
    return str
      .split(":")
      .filter((x) => x !== "")
      .map((x) => (/^[0-9a-f]{1,4}$/.test(x) ? parseInt(x, 16) : NaN));
  };

  let headW = toWords(head);
  let tailW = tail === null ? [] : toWords(tail);
  tailW = tailW.concat(tailWords);
  if (tail === null && tailWords.length) {
    headW = headW.concat(tailWords);
  }
  if (headW.some(Number.isNaN) || tailW.some(Number.isNaN)) {
    return null;
  }

  let words: number[];
  if (dbl !== -1) {
    const missing = 8 - (headW.length + tailW.length);
    if (missing < 0) {
      return null;
    }
    words = headW.concat(new Array(missing).fill(0)).concat(tailW);
  } else {
    words = headW;
  }

  if (words.length !== 8) {
    return null;
  }
  if (words.some((w) => !Number.isInteger(w) || w < 0 || w > 0xffff)) {
    return null;
  }
  return words;
}

function isPrivateIPv6(input: string): boolean {
  const w = expandIPv6(input);
  if (!w) {
    return false;
  }

  // :: unspecified
  if (w.every((x) => x === 0)) {
    return true;
  }
  // ::1 loopback
  if (
    w[0] === 0 &&
    w[1] === 0 &&
    w[2] === 0 &&
    w[3] === 0 &&
    w[4] === 0 &&
    w[5] === 0 &&
    w[6] === 0 &&
    w[7] === 1
  ) {
    return true;
  }
  // fe80::/10 link-local
  if ((w[0] & 0xffc0) === 0xfe80) {
    return true;
  }
  // fc00::/7 unique local addresses
  if ((w[0] & 0xfe00) === 0xfc00) {
    return true;
  }
  // IPv4-mapped (::ffff:0:0/96) and IPv4-compatible (::/96) -> inspect embedded IPv4
  const firstFiveZero =
    w[0] === 0 && w[1] === 0 && w[2] === 0 && w[3] === 0 && w[4] === 0;
  if (firstFiveZero && (w[5] === 0xffff || w[5] === 0)) {
    const o = [(w[6] >> 8) & 0xff, w[6] & 0xff, (w[7] >> 8) & 0xff, w[7] & 0xff];
    if (isPrivateIPv4Octets(o)) {
      return true;
    }
  }

  return false;
}

export function validateWebhookDestination(destination: string): string | null {
  if (!destination || typeof destination !== "string") {
    return "Invalid destination URL";
  }
  if (!destination.startsWith("https://")) {
    return "Destination must use HTTPS";
  }
  try {
    const url = new URL(destination);
    if (isPrivateOrReservedHostname(url.hostname)) {
      return "Destination cannot point to private or internal networks";
    }
  } catch {
    return "Invalid destination URL format";
  }
  return null;
}
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

    const destinationError = validateWebhookDestination(webhook.destination);
    if (destinationError) {
      return ok(`Skipping webhook: ${destinationError}`);
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

    const destinationError = validateWebhookDestination(webhook.destination);
    if (destinationError) {
      return err(destinationError);
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
