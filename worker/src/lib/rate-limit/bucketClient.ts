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
  SegmentType,
} from "./policyParser";
import {
  extractSegmentIdentifier,
  buildDurableObjectKey,
  createPropertySourceFromHeaders,
} from "./segmentExtractor";
import { Result, err, ok } from "../util/results";
import { DataDogTracer, TraceContext } from "../monitoring/DataDogTracer";

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

// Get the segment type as a string for logging
function getSegmentTypeString(segment: SegmentType): string {
  if (segment.type === "global") {
    return "global";
  } else if (segment.type === "user") {
    return "user";
  } else {
    return segment.name;
  }
}

// Get just the raw segment value for logging (without the key= prefix)
function getRawSegmentValue(
  properties: Record<string, string>,
  userId: string | undefined,
  segment: SegmentType
): string {
  if (segment.type === "global") {
    return "global";
  } else if (segment.type === "user") {
    return userId ?? "unknown";
  } else {
    return properties[segment.name.toLowerCase()] ?? "unknown";
  }
}

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
  /** Optional DataDog tracer for monitoring */
  tracer?: DataDogTracer;
  /** Optional trace context for span correlation */
  traceContext?: TraceContext | null;
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

  // Get segment info for logging
  const segmentTypeStr = getSegmentTypeString(policy.segment);
  const rawSegmentValue = getRawSegmentValue(
    params.heliconeProperties,
    params.userId,
    policy.segment
  );

  // Generate a policy_id for grouping in dashboards
  const policyId = `${params.organizationId}_${segmentTypeStr}_${policy.quota}_${policy.windowSeconds}_${policy.unit}`;

  // Start tracing span if tracer is available
  const spanId =
    params.tracer && params.traceContext?.sampled
      ? params.tracer.startSpan(
          "bucket_rate_limit.check",
          "checkBucketRateLimit",
          "bucket-rate-limiter",
          {
            org_id: params.organizationId,
            policy_id: policyId,
            segment: segmentTypeStr,
            segment_value: rawSegmentValue,
          },
          params.traceContext
        )
      : null;

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
    if (params.tracer && spanId) {
      params.tracer.setError(spanId, cost.error);
      params.tracer.finishSpan(spanId);
    }
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

    // Add result tags to span
    if (params.tracer && spanId) {
      params.tracer.setTag(
        spanId,
        "rate_limited",
        response.allowed ? "false" : "true"
      );
      params.tracer.setTag(spanId, "remaining", response.remaining);
      params.tracer.setTag(spanId, "time_window_seconds", policy.windowSeconds);
      params.tracer.setTag(spanId, "quota_limit", policy.quota);
      params.tracer.setTag(spanId, "rate_limit_unit", policy.unit);
      params.tracer.setTag(spanId, "check_only", isCentsWithoutCost.toString());
      params.tracer.finishSpan(spanId);
    }

    return createSuccessResult(response, policy);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown DO error";

    // Set error on span
    if (params.tracer && spanId) {
      params.tracer.setError(spanId, error instanceof Error ? error : String(error));
      params.tracer.finishSpan(spanId);
    }

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
  /** Optional DataDog tracer for monitoring */
  tracer?: DataDogTracer;
  /** Optional trace context for span correlation */
  traceContext?: TraceContext | null;
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

  // Get segment info for logging
  const segmentTypeStr = getSegmentTypeString(policy.segment);
  const rawSegmentValue = getRawSegmentValue(
    params.heliconeProperties,
    params.userId,
    policy.segment
  );

  // Generate a policy_id for grouping in dashboards
  const policyId = `${params.organizationId}_${segmentTypeStr}_${policy.quota}_${policy.windowSeconds}_${policy.unit}`;

  // Start tracing span if tracer is available
  const spanId =
    params.tracer && params.traceContext?.sampled
      ? params.tracer.startSpan(
          "bucket_rate_limit.update",
          "recordBucketUsage",
          "bucket-rate-limiter",
          {
            org_id: params.organizationId,
            policy_id: policyId,
            segment: segmentTypeStr,
            segment_value: rawSegmentValue,
          },
          params.traceContext
        )
      : null;

  const doKey = buildDurableObjectKey(
    params.organizationId,
    segment,
    policy.unit
  );

  try {
    const doId = params.rateLimiterDO.idFromName(doKey);
    const doStub = params.rateLimiterDO.get(doId);

    // Consume the actual cost
    const response = await doStub.consume({
      capacity: policy.quota,
      windowSeconds: policy.windowSeconds,
      unit: policy.unit,
      cost: params.costCents,
      policyString: policy.policyString,
      checkOnly: false,
    });

    // Add result tags to span
    if (params.tracer && spanId) {
      params.tracer.setTag(spanId, "time_window_seconds", policy.windowSeconds);
      params.tracer.setTag(spanId, "quota_limit", policy.quota);
      params.tracer.setTag(spanId, "rate_limit_unit", policy.unit);
      params.tracer.setTag(spanId, "cost", params.costCents);
      params.tracer.setTag(spanId, "update_success", "true");
      params.tracer.setTag(spanId, "new_remaining", response.remaining);
      params.tracer.finishSpan(spanId);
    }
  } catch (error) {
    // Set error on span
    if (params.tracer && spanId) {
      params.tracer.setError(spanId, error instanceof Error ? error : String(error));
      params.tracer.setTag(spanId, "update_failed", "true");
      params.tracer.finishSpan(spanId);
    }
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
