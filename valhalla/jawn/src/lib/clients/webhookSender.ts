import { Database } from "../db/database.types";
import { createHmac } from "crypto";
import dns from "node:dns";
import https from "node:https";
import {
  PromiseGenericResult,
  Result,
  ok,
  err,
} from "../../packages/common/result";
import { WebhookConfig } from "../shared/types";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Destination validation (SSRF protection)
//
// Webhook destinations are customer-controlled URLs that Jawn POSTs to from
// inside our network. Every delivery:
//   1. checks the URL syntactically (https only, no internal hostnames),
//   2. resolves the hostname and rejects it if ANY address is private,
//      loopback, link-local, CGNAT, ULA, multicast, reserved, IPv4-mapped to
//      one of those, or a cloud metadata address,
//   3. connects to the exact address that was validated (the socket's DNS
//      lookup is pinned), so a second resolution cannot rebind to an internal
//      address, and
//   4. never follows redirects (any 3xx is a failed delivery).
// ---------------------------------------------------------------------------

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata",
  "metadata.google.internal",
  "metadata.azure.internal",
  "instance-data",
  "instance-data.ec2.internal",
]);

const BLOCKED_HOSTNAME_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".corp",
  ".lan",
  ".home",
  ".home.arpa",
  ".intranet",
  ".private",
];

/**
 * Lowercases a hostname, strips IPv6 brackets and any trailing dots
 * ("example.com." and "localhost.." resolve the same as without the dots).
 */
export function normalizeWebhookHostname(hostname: string): string {
  let host = hostname.trim().toLowerCase();
  if (host.startsWith("[") && host.endsWith("]")) {
    host = host.slice(1, -1);
  }
  host = host.replace(/\.+$/, "");
  return host;
}

function parseIPv4(ip: string): number[] | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const octets: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    octets.push(n);
  }
  return octets;
}

function isBlockedIPv4(octets: number[]): boolean {
  const [a, b, c] = octets;
  return (
    a === 0 || // 0.0.0.0/8 "this network"
    a === 10 || // 10.0.0.0/8 private
    (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10 CGNAT
    a === 127 || // 127.0.0.0/8 loopback
    (a === 169 && b === 254) || // 169.254.0.0/16 link-local + cloud metadata
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12 private
    (a === 192 && b === 0 && c === 0) || // 192.0.0.0/24 IETF protocol assignments
    (a === 192 && b === 0 && c === 2) || // 192.0.2.0/24 TEST-NET-1
    (a === 192 && b === 88 && c === 99) || // 192.88.99.0/24 6to4 relay anycast
    (a === 192 && b === 168) || // 192.168.0.0/16 private
    (a === 198 && (b === 18 || b === 19)) || // 198.18.0.0/15 benchmarking
    (a === 198 && b === 51 && c === 100) || // 198.51.100.0/24 TEST-NET-2
    (a === 203 && b === 0 && c === 113) || // 203.0.113.0/24 TEST-NET-3
    a >= 224 // 224/4 multicast, 240/4 reserved, 255.255.255.255 broadcast
  );
}

/** Expands an IPv6 address (optionally with an embedded IPv4 tail) to 16 bytes. */
function parseIPv6(ip: string): number[] | null {
  let addr = ip;
  const zoneIdx = addr.indexOf("%");
  if (zoneIdx !== -1) addr = addr.slice(0, zoneIdx);
  if (!addr.includes(":")) return null;

  let tail: number[] = [];
  const lastColon = addr.lastIndexOf(":");
  const maybeV4 = addr.slice(lastColon + 1);
  if (maybeV4.includes(".")) {
    const v4 = parseIPv4(maybeV4);
    if (!v4) return null;
    tail = v4;
    addr = addr.slice(0, lastColon + 1) + "0:0";
  }

  const halves = addr.split("::");
  if (halves.length > 2) return null;
  const parseGroups = (part: string): number[] | null => {
    if (part === "") return [];
    const out: number[] = [];
    for (const g of part.split(":")) {
      if (!/^[0-9a-f]{1,4}$/i.test(g)) return null;
      out.push(parseInt(g, 16));
    }
    return out;
  };
  const head = parseGroups(halves[0]);
  const rest = halves.length === 2 ? parseGroups(halves[1]) : [];
  if (!head || !rest) return null;
  let groups: number[];
  if (halves.length === 2) {
    const missing = 8 - head.length - rest.length;
    if (missing < 1) return null;
    groups = [...head, ...new Array<number>(missing).fill(0), ...rest];
  } else {
    groups = head;
  }
  if (groups.length !== 8) return null;

  const bytes: number[] = [];
  for (const g of groups) {
    bytes.push((g >> 8) & 0xff, g & 0xff);
  }
  if (tail.length === 4) {
    bytes.splice(12, 4, ...tail);
  }
  return bytes;
}

function isBlockedIPv6(bytes: number[]): boolean {
  const allZero = (from: number, to: number) =>
    bytes.slice(from, to).every((b) => b === 0);

  // :: (unspecified) and ::1 (loopback)
  if (allZero(0, 15) && (bytes[15] === 0 || bytes[15] === 1)) return true;

  // ::ffff:0:0/96 IPv4-mapped -> judge the embedded IPv4 address
  if (allZero(0, 10) && bytes[10] === 0xff && bytes[11] === 0xff) {
    return isBlockedIPv4(bytes.slice(12, 16));
  }
  // ::/96 IPv4-compatible (deprecated) -> judge the embedded IPv4 address
  if (allZero(0, 12)) {
    return isBlockedIPv4(bytes.slice(12, 16));
  }
  // 64:ff9b::/96 (and 64:ff9b:1::/48) NAT64 -> judge the embedded IPv4 address
  if (
    bytes[0] === 0x00 &&
    bytes[1] === 0x64 &&
    bytes[2] === 0xff &&
    bytes[3] === 0x9b
  ) {
    return isBlockedIPv4(bytes.slice(12, 16));
  }
  // 2002::/16 6to4 -> judge the embedded IPv4 address
  if (bytes[0] === 0x20 && bytes[1] === 0x02) {
    return isBlockedIPv4(bytes.slice(2, 6));
  }
  // 2001::/32 Teredo (tunnels to arbitrary IPv4)
  if (
    bytes[0] === 0x20 &&
    bytes[1] === 0x01 &&
    bytes[2] === 0x00 &&
    bytes[3] === 0x00
  ) {
    return true;
  }
  // 2001:db8::/32 documentation
  if (
    bytes[0] === 0x20 &&
    bytes[1] === 0x01 &&
    bytes[2] === 0x0d &&
    bytes[3] === 0xb8
  ) {
    return true;
  }
  // 100::/64 discard-only
  if (bytes[0] === 0x01 && bytes[1] === 0x00 && allZero(2, 8)) return true;
  // fc00::/7 unique local (includes AWS IMDS fd00:ec2::254)
  if ((bytes[0] & 0xfe) === 0xfc) return true;
  // fe80::/10 link-local and fec0::/10 site-local (deprecated)
  if (bytes[0] === 0xfe && (bytes[1] & 0xc0) >= 0x80) return true;
  // ff00::/8 multicast
  if (bytes[0] === 0xff) return true;

  return false;
}

function isIpLiteral(host: string): boolean {
  return parseIPv4(host) !== null || parseIPv6(host) !== null;
}

/**
 * True if the IP literal is not a public unicast address. Unparseable input
 * is treated as blocked.
 */
export function isBlockedIpAddress(ip: string): boolean {
  const host = normalizeWebhookHostname(ip);
  const v4 = parseIPv4(host);
  if (v4) return isBlockedIPv4(v4);
  const v6 = parseIPv6(host);
  if (v6) return isBlockedIPv6(v6);
  return true;
}

function isBlockedHostname(host: string): boolean {
  if (host === "") return true;
  if (isIpLiteral(host)) return isBlockedIpAddress(host);
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return true;
  }
  // Single-label names resolve through search domains to internal hosts.
  if (!host.includes(".")) return true;
  return false;
}

/**
 * Synchronous syntactic validation of a webhook destination. Returns an error
 * message, or null if the URL may be resolved and delivered to. DNS is checked
 * separately by resolveWebhookDestination.
 */
export function validateWebhookDestination(
  destination: unknown
): string | null {
  if (!destination || typeof destination !== "string") {
    return "Invalid destination URL";
  }
  if (destination.length > 2048) {
    return "Destination URL is too long";
  }
  let url: URL;
  try {
    url = new URL(destination);
  } catch {
    return "Invalid destination URL format";
  }
  if (url.protocol !== "https:") {
    return "Destination must use HTTPS";
  }
  if (url.username || url.password) {
    return "Destination must not contain credentials";
  }
  if (isBlockedHostname(normalizeWebhookHostname(url.hostname))) {
    return "Destination cannot point to private or internal networks";
  }
  return null;
}

export type ResolvedWebhookTarget = {
  url: URL;
  hostname: string;
  address: string;
  family: 4 | 6;
};

export type LookupAllFn = (
  hostname: string,
  options: { all: true; verbatim?: boolean }
) => Promise<Array<{ address: string; family: number }>>;

const defaultLookupAll: LookupAllFn = (hostname, options) =>
  dns.promises.lookup(hostname, options);

/**
 * Validates the destination and resolves its hostname. Fails if the hostname
 * does not resolve or if ANY resolved address is non-public. The returned
 * address is the one the request must connect to.
 */
export async function resolveWebhookDestination(
  destination: unknown,
  lookupAll: LookupAllFn = defaultLookupAll
): Promise<Result<ResolvedWebhookTarget, string>> {
  const syntaxError = validateWebhookDestination(destination);
  if (syntaxError) {
    return err(syntaxError);
  }
  const url = new URL(destination as string);
  const hostname = normalizeWebhookHostname(url.hostname);

  if (isIpLiteral(hostname)) {
    return ok({
      url,
      hostname,
      address: hostname,
      family: parseIPv4(hostname) ? 4 : 6,
    });
  }

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await lookupAll(hostname, { all: true, verbatim: true });
  } catch {
    return err("Destination hostname could not be resolved");
  }
  if (!addresses || addresses.length === 0) {
    return err("Destination hostname could not be resolved");
  }
  if (addresses.some((a) => isBlockedIpAddress(a.address))) {
    return err("Destination cannot point to private or internal networks");
  }
  const first = addresses[0];
  return ok({
    url,
    hostname,
    address: first.address,
    family: first.family === 6 ? 6 : 4,
  });
}

export type WebhookDeliveryResult =
  | { delivered: true; status: number }
  | {
      delivered: false;
      reason:
        | "invalid_destination"
        | "redirect"
        | "http_error"
        | "timeout"
        | "network_error";
      detail: string;
      status?: number;
    };

/** Only 2xx counts as delivered; 3xx is never followed. */
export function classifyWebhookStatus(
  status: number
): "delivered" | "redirect" | "http_error" {
  if (status >= 200 && status < 300) return "delivered";
  if (status >= 300 && status < 400) return "redirect";
  return "http_error";
}

/**
 * POSTs a webhook body to a validated destination over a socket pinned to the
 * validated address. Redirects are not followed (equivalent to fetch's
 * `redirect: "manual"` with 3xx treated as failure). Never throws.
 *
 * Uses node:https rather than fetch because pinning the resolved address needs
 * a custom `lookup`, and undici is not a direct dependency of Jawn.
 */
export async function deliverWebhook(
  destination: string,
  body: string,
  headers: Record<string, string>,
  timeoutMs: number,
  lookupAll: LookupAllFn = defaultLookupAll
): Promise<WebhookDeliveryResult> {
  const resolved = await resolveWebhookDestination(destination, lookupAll);
  if (resolved.error || !resolved.data) {
    return {
      delivered: false,
      reason: "invalid_destination",
      detail: resolved.error ?? "Invalid destination",
    };
  }
  const target = resolved.data;

  // Pin the connection to the address we validated. Node may call lookup with
  // { all: true } (autoSelectFamily), so support both callback shapes.
  const pinnedLookup = (
    _hostname: string,
    options: dns.LookupOptions,
    callback: (...args: any[]) => void
  ) => {
    if (options?.all) {
      callback(null, [{ address: target.address, family: target.family }]);
    } else {
      callback(null, target.address, target.family);
    }
  };

  return await new Promise<WebhookDeliveryResult>((resolve) => {
    let settled = false;
    let timer: NodeJS.Timeout | undefined;
    const finish = (result: WebhookDeliveryResult) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(result);
    };

    let req: ReturnType<typeof https.request>;
    try {
      req = https.request(
        {
          protocol: "https:",
          hostname: target.hostname,
          port: target.url.port ? Number(target.url.port) : 443,
          path: `${target.url.pathname}${target.url.search}`,
          method: "POST",
          headers: {
            ...headers,
            "Content-Length": Buffer.byteLength(body).toString(),
          },
          lookup: pinnedLookup as any,
          servername: isIpLiteral(target.hostname)
            ? undefined
            : target.hostname,
          agent: false,
        },
        (res) => {
          // Drain and discard the response body; only the status matters.
          res.resume();
          const status = res.statusCode ?? 0;
          const kind = classifyWebhookStatus(status);
          if (kind === "delivered") {
            finish({ delivered: true, status });
          } else {
            finish({
              delivered: false,
              reason: kind,
              status,
              detail:
                kind === "redirect"
                  ? `Webhook destination responded with a redirect (${status}); redirects are not followed`
                  : `Webhook request failed with status ${status}`,
            });
          }
          req.destroy();
        }
      );
    } catch (error) {
      finish({
        delivered: false,
        reason: "network_error",
        detail: error instanceof Error ? error.message : "Unknown error",
      });
      return;
    }

    timer = setTimeout(() => {
      finish({
        delivered: false,
        reason: "timeout",
        detail: `Request timed out after ${Math.round(timeoutMs / 1000)} seconds`,
      });
      req.destroy();
    }, timeoutMs);

    req.on("error", (error) => {
      finish({
        delivered: false,
        reason: "network_error",
        detail: error instanceof Error ? error.message : "Unknown error",
      });
    });

    req.end(body);
  });
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

    // sleep for 30 seconds before sending the webhook to allow for the request to be logged in clickhouse
    await new Promise((resolve) => setTimeout(resolve, 30_000));

    const delivery = await deliverWebhook(
      webhook.destination,
      webHookPayload,
      {
        "Content-Type": "application/json",
        "Helicone-Signature": hash,
      },
      2 * 60 * 1000
    );

    if (!delivery.delivered) {
      if (delivery.reason === "timeout") {
        console.error("Webhook request timed out after 2 minutes");
      }
      return ok(`Failed to send webhook: ${delivery.detail}`);
    }
  } catch (error: unknown) {
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

export const TEST_WEBHOOK_FAILED_MESSAGE =
  "Test webhook could not be delivered. Check that the destination is reachable over HTTPS and returns a 2xx response without redirecting.";

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

    // Short timeout for test webhooks (10 seconds)
    const delivery = await deliverWebhook(
      webhook.destination,
      webHookPayload,
      {
        "Content-Type": "application/json",
        "Helicone-Signature": hash,
      },
      10 * 1000
    );

    if (!delivery.delivered) {
      if (delivery.reason === "invalid_destination") {
        // Our own validation message about the configured URL; safe to show.
        return err(delivery.detail);
      }
      // Never echo upstream status lines, error text or timing back to the
      // caller: the test endpoint must not work as a network probe.
      return err(TEST_WEBHOOK_FAILED_MESSAGE);
    }
  } catch (error: unknown) {
    return err(TEST_WEBHOOK_FAILED_MESSAGE);
  }

  return ok(`Test webhook sent successfully`);
}
