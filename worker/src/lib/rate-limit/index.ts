/**
 * Rate Limiting Module
 *
 * Provides token bucket rate limiting for the Helicone AI Gateway.
 *
 * Usage:
 * ```typescript
 * import { checkTokenBucketRateLimit } from './rate-limit';
 *
 * const result = await checkTokenBucketRateLimit({
 *   policyHeader: request.headers.get('Helicone-RateLimit-Policy'),
 *   organizationId: orgData.organizationId,
 *   userId: proxyRequest.userId,
 *   heliconeProperties: proxyRequest.heliconeProperties,
 *   rateLimiterDO: env.TOKEN_BUCKET_RATE_LIMITER,
 * });
 *
 * if (!result.allowed) {
 *   return new Response('Rate limit exceeded', { status: 429, headers: result.headers });
 * }
 * ```
 */

// Policy parsing
export {
  parseRateLimitPolicy,
  buildPolicyString,
  isValidPolicy,
  type ParsedRateLimitPolicy,
  type RateLimitUnit,
  type SegmentType,
  type PolicyValidationError,
} from "./policyParser";

// Segment extraction
export {
  extractSegmentIdentifier,
  buildDurableObjectKey,
  createPropertySourceFromHeaders,
  type SegmentIdentifier,
  type SegmentExtractionError,
  type HeliconePropertySource,
} from "./segmentExtractor";

// Token bucket client
export {
  checkTokenBucketRateLimit,
  checkTokenBucketRateLimitOnly,
  recordTokenBucketUsage,
  buildRateLimitResponseHeaders,
  type RateLimitCheckResult,
  type RateLimitHeaders,
  type TokenBucketClientConfig,
} from "./tokenBucketClient";
