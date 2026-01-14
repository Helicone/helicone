/**
 * Bucket Rate Limiter Client
 *
 * Provides the interface for the worker to interact with the
 * BucketRateLimiterDO for rate limiting decisions.
 *
 * Features:
 * - Parses policy from request headers
 * - Extracts segment identifiers
 * - Calls the appropriate Durable Object
 * - Handles errors with configurable fail-open/fail-closed behavior
 * - Returns formatted rate limit response headers
 *
 * Flow differs by unit type:
 *
 * REQUEST-based (unit="request"):
 *   1. checkBucketRateLimit() → checks AND deducts in one call
 *   2. Request proceeds or is denied
 *   3. No post-request action needed
 *
 * COST-based (unit="cents"):
 *   1. checkBucketRateLimit() → checkOnly=true, verifies capacity exists
 *   2. Request proceeds (cost unknown until LLM responds)
 *   3. recordBucketUsage() → deducts actual cost post-request
 *
 * See BucketRateLimiterDO header comment for detailed rationale.
 */

import {
  BucketRateLimiterDO,
  BucketResponse,
} from "../durable-objects/BucketRateLimiterDO";
import {
  parseRateLimitPolicy,
  ParsedRateLimitPolicy,
  buildPolicyString,
} from "./policyParser";
import {
  extractSegmentIdentifier,
  buildDurableObjectKey,
  createPropertySourceFromHeaders,
} from "./segmentExtractor";
import { Result, err, ok } from "../util/results";

/**
 * Result of a rate limit check
 */
export interface RateLimitCheckResult {
  /** Whether the request should be allowed */
  allowed: boolean;
  /** HTTP status code to return if rate limited */
  statusCode: 200 | 429;
  /** Rate limit response headers to add */
  headers: RateLimitHeaders;
  /** Parsed policy (for logging/debugging) */
  policy: ParsedRateLimitPolicy | null;
  /** Any errors that occurred (request may still be allowed if fail-open) */
  error?: string;
}

export interface RateLimitHeaders {
  "Helicone-RateLimit-Limit"?: string;
  "Helicone-RateLimit-Remaining"?: string;
  "Helicone-RateLimit-Policy"?: string;
  "Helicone-RateLimit-Reset"?: string;
}

/**
 * Configuration for the rate limiter client
 */
export interface BucketClientConfig {
  /**
   * Behavior when rate limiter encounters an error:
   * - "fail-open": Allow the request (default, preserves availability)
   * - "fail-closed": Deny the request (preserves cost control)
   */
  failureMode: "fail-open" | "fail-closed";
  /**
   * Default cost for requests when using u=cents without explicit cost
   * Set to 0 to reject cost-based policies without explicit cost
   */
  defaultCostCents: number;
}

const DEFAULT_CONFIG: BucketClientConfig = {
  failureMode: "fail-open",
  defaultCostCents: 0, // Reject cost-based policies without explicit cost
};

/**
 * Check rate limit for a request
 *
 * @param params - Rate limit check parameters
 * @returns Rate limit check result
 */
export async function checkBucketRateLimit(params: {
  /** The Helicone-RateLimit-Policy header value */
  policyHeader: string | null | undefined;
  /** Organization ID for bucket isolation */
  organizationId: string;
  /** User ID from Helicone-User-Id header */
  userId: string | undefined;
  /** Properties from Helicone-Property-* headers */
  heliconeProperties: Record<string, string>;
  /** DO namespace for the bucket rate limiter */
  rateLimiterDO: DurableObjectNamespace<BucketRateLimiterDO>;
  /** Cost in cents (for u=cents policies) */
  costCents?: number;
  /** Optional configuration overrides */
  config?: Partial<BucketClientConfig>;
}): Promise<RateLimitCheckResult> {
  const config = { ...DEFAULT_CONFIG, ...params.config };

  // Parse the policy
  const policyResult = parseRateLimitPolicy(params.policyHeader);

  if (policyResult.error) {
    return createErrorResult(
      `Invalid rate limit policy: ${policyResult.error.message}`,
      config.failureMode
    );
  }

  const policy = policyResult.data;

  // No policy = no rate limiting
  if (!policy) {
    return {
      allowed: true,
      statusCode: 200,
      headers: {},
      policy: null,
    };
  }

  // Extract segment identifier
  const propertySource = createPropertySourceFromHeaders(
    params.heliconeProperties,
    params.userId
  );

  const segmentResult = extractSegmentIdentifier(
    policy.segment,
    propertySource
  );

  if (segmentResult.error) {
    return createErrorResult(
      segmentResult.error.message,
      config.failureMode,
      policy
    );
  }

  const segment = segmentResult.data!;

  // For cents-based policies without explicit cost, we do a check-only
  // to see if there's capacity. Actual cost is recorded post-request.
  const isCentsWithoutCost =
    policy.unit === "cents" &&
    params.costCents === undefined &&
    config.defaultCostCents <= 0;

  // Determine cost (use check-only mode for cents without explicit cost)
  const cost = determineCost(
    policy,
    params.costCents,
    config,
    isCentsWithoutCost
  );

  if (cost.error) {
    return createErrorResult(cost.error, config.failureMode, policy);
  }

  // Build DO key
  const doKey = buildDurableObjectKey(
    params.organizationId,
    segment,
    policy.unit
  );

  // Call the Durable Object
  try {
    const doId = params.rateLimiterDO.idFromName(doKey);
    const doStub = params.rateLimiterDO.get(doId);

    const response = await doStub.consume({
      capacity: policy.quota,
      windowSeconds: policy.windowSeconds,
      unit: policy.unit,
      cost: cost.data!,
      policyString: policy.policyString,
      // For cents without explicit cost: check-only (don't consume tokens yet)
      // Actual consumption happens post-request via recordBucketUsage
      checkOnly: isCentsWithoutCost,
    });

    return createSuccessResult(response, policy);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown DO error";

    return createErrorResult(
      `Rate limiter error: ${errorMessage}`,
      config.failureMode,
      policy
    );
  }
}

/**
 * Check rate limit without consuming tokens (for pre-check scenarios)
 */
export async function checkBucketRateLimitOnly(params: {
  policyHeader: string | null | undefined;
  organizationId: string;
  userId: string | undefined;
  heliconeProperties: Record<string, string>;
  rateLimiterDO: DurableObjectNamespace<BucketRateLimiterDO>;
  costCents?: number;
  config?: Partial<BucketClientConfig>;
}): Promise<RateLimitCheckResult> {
  const config = { ...DEFAULT_CONFIG, ...params.config };

  const policyResult = parseRateLimitPolicy(params.policyHeader);
  if (policyResult.error || !policyResult.data) {
    return {
      allowed: true,
      statusCode: 200,
      headers: {},
      policy: null,
    };
  }

  const policy = policyResult.data;
  const propertySource = createPropertySourceFromHeaders(
    params.heliconeProperties,
    params.userId
  );

  const segmentResult = extractSegmentIdentifier(
    policy.segment,
    propertySource
  );
  if (segmentResult.error) {
    return createErrorResult(
      segmentResult.error.message,
      config.failureMode,
      policy
    );
  }

  const segment = segmentResult.data!;
  const cost = determineCost(policy, params.costCents, config);
  if (cost.error) {
    return createErrorResult(cost.error, config.failureMode, policy);
  }

  const doKey = buildDurableObjectKey(
    params.organizationId,
    segment,
    policy.unit
  );

  try {
    const doId = params.rateLimiterDO.idFromName(doKey);
    const doStub = params.rateLimiterDO.get(doId);

    const response = await doStub.consume({
      capacity: policy.quota,
      windowSeconds: policy.windowSeconds,
      unit: policy.unit,
      cost: cost.data!,
      policyString: policy.policyString,
      checkOnly: true, // Don't consume tokens
    });

    return createSuccessResult(response, policy);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown DO error";
    return createErrorResult(
      `Rate limiter error: ${errorMessage}`,
      config.failureMode,
      policy
    );
  }
}

/**
 * Update rate limit counter after successful request (for post-request cost recording)
 */
export async function recordBucketUsage(params: {
  policyHeader: string | null | undefined;
  organizationId: string;
  userId: string | undefined;
  heliconeProperties: Record<string, string>;
  rateLimiterDO: DurableObjectNamespace<BucketRateLimiterDO>;
  costCents: number;
}): Promise<void> {
  const policyResult = parseRateLimitPolicy(params.policyHeader);
  if (policyResult.error || !policyResult.data) {
    return;
  }

  const policy = policyResult.data;

  // Only record for cents-based policies
  if (policy.unit !== "cents") {
    return;
  }

  const propertySource = createPropertySourceFromHeaders(
    params.heliconeProperties,
    params.userId
  );

  const segmentResult = extractSegmentIdentifier(
    policy.segment,
    propertySource
  );
  if (segmentResult.error) {
    return;
  }

  const segment = segmentResult.data!;
  const doKey = buildDurableObjectKey(
    params.organizationId,
    segment,
    policy.unit
  );

  try {
    const doId = params.rateLimiterDO.idFromName(doKey);
    const doStub = params.rateLimiterDO.get(doId);

    // Consume the actual cost
    await doStub.consume({
      capacity: policy.quota,
      windowSeconds: policy.windowSeconds,
      unit: policy.unit,
      cost: params.costCents,
      policyString: policy.policyString,
      checkOnly: false,
    });
  } catch {
    // Silently fail - usage recording is best-effort
  }
}

// --- Helper functions ---

function determineCost(
  policy: ParsedRateLimitPolicy,
  explicitCost: number | undefined,
  config: BucketClientConfig,
  isCheckOnly: boolean = false
): Result<number, string> {
  if (policy.unit === "request") {
    return ok(1);
  }

  // For cents-based policies
  if (explicitCost !== undefined && explicitCost >= 0) {
    return ok(explicitCost);
  }

  if (config.defaultCostCents > 0) {
    return ok(config.defaultCostCents);
  }

  // For check-only mode (pre-request check for cents-based policies):
  // We use cost=0 which makes the DO check if tokens > 0 (any budget left).
  // This is simpler and more correct because:
  // - We don't know actual cost until after the request
  // - Overspending by one request is inevitable and acceptable
  // - Post-request recording can push tokens negative, blocking future requests
  if (isCheckOnly) {
    return ok(0);
  }

  return err(
    "Cost-based rate limiting (u=cents) requires cost to be provided via Helicone-RateLimit-Cost-Cents header or computed from the request"
  );
}

function createSuccessResult(
  response: BucketResponse,
  policy: ParsedRateLimitPolicy
): RateLimitCheckResult {
  const headers: RateLimitHeaders = {
    "Helicone-RateLimit-Limit": response.limit.toString(),
    "Helicone-RateLimit-Remaining": response.remaining.toString(),
    "Helicone-RateLimit-Policy": buildPolicyString(policy),
  };

  if (response.resetSeconds > 0) {
    headers["Helicone-RateLimit-Reset"] = response.resetSeconds.toString();
  }

  return {
    allowed: response.allowed,
    statusCode: response.allowed ? 200 : 429,
    headers,
    policy,
  };
}

function createErrorResult(
  error: string,
  failureMode: "fail-open" | "fail-closed",
  policy?: ParsedRateLimitPolicy | null
): RateLimitCheckResult {
  const allowed = failureMode === "fail-open";

  return {
    allowed,
    statusCode: allowed ? 200 : 429,
    headers: policy
      ? {
          "Helicone-RateLimit-Policy": buildPolicyString(policy),
        }
      : {},
    policy: policy ?? null,
    error,
  };
}

/**
 * Build rate limit headers from a check result
 */
export function buildRateLimitResponseHeaders(
  result: RateLimitCheckResult
): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(result.headers)) {
    if (value) {
      headers.set(key, value);
    }
  }
  return headers;
}
