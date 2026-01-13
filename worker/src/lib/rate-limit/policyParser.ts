/**
 * Rate Limit Policy Parser
 *
 * Parses the Helicone-RateLimit-Policy header format:
 *   [quota];w=[time_window];u=[unit];s=[segment]
 *
 * Examples:
 *   - "1000;w=3600" -> 1000 requests per hour, global
 *   - "5000;w=86400;u=cents" -> 5000 cents per day, global
 *   - "100;w=60;s=user" -> 100 requests per minute, per user
 *   - "10000;w=3600;s=organization" -> 10000 requests per hour, per organization property
 *
 * Follows Helicone docs: https://docs.helicone.ai/features/advanced-usage/custom-rate-limits
 */

import { Result, err, ok } from "../util/results";

export type RateLimitUnit = "request" | "cents";

export type SegmentType =
  | { type: "global" }
  | { type: "user" }
  | { type: "property"; name: string };

export interface ParsedRateLimitPolicy {
  /** Number of requests or cents allowed */
  quota: number;
  /** Time window in seconds (min 60) */
  windowSeconds: number;
  /** Unit of measurement */
  unit: RateLimitUnit;
  /** Segmentation strategy */
  segment: SegmentType;
  /** Original policy string for response headers */
  policyString: string;
}

export interface PolicyValidationError {
  field: string;
  message: string;
  value?: string;
}

/**
 * Parse and validate a rate limit policy string
 *
 * @param policyString - The raw Helicone-RateLimit-Policy header value
 * @returns Parsed policy or validation error
 */
export function parseRateLimitPolicy(
  policyString: string | null | undefined
): Result<ParsedRateLimitPolicy | null, PolicyValidationError> {
  // No policy = no rate limiting
  if (!policyString || policyString.trim() === "") {
    return ok(null);
  }

  const trimmed = policyString.trim();

  // Parse the policy string using regex
  // Format: [quota];w=[window];u=[unit];s=[segment]
  // Only quota and w are required; u and s are optional
  const regex = /^(\d+);w=(\d+)(?:;u=(request|cents))?(?:;s=([\w-]+))?$/i;
  const match = trimmed.match(regex);

  if (!match) {
    return err({
      field: "policy",
      message:
        'Invalid policy format. Expected "[quota];w=[window]" with optional ";u=[unit]" and ";s=[segment]"',
      value: trimmed,
    });
  }

  const [, quotaStr, windowStr, unitStr, segmentStr] = match;

  // Parse quota
  const quota = parseInt(quotaStr, 10);
  if (isNaN(quota) || quota <= 0) {
    return err({
      field: "quota",
      message: "Quota must be a positive integer",
      value: quotaStr,
    });
  }

  // Parse window
  const windowSeconds = parseInt(windowStr, 10);
  if (isNaN(windowSeconds)) {
    return err({
      field: "window",
      message: "Window must be an integer",
      value: windowStr,
    });
  }

  if (windowSeconds < 60) {
    return err({
      field: "window",
      message: "Window must be at least 60 seconds",
      value: windowStr,
    });
  }

  // Prevent overflow with very large windows (max 1 year)
  if (windowSeconds > 31536000) {
    return err({
      field: "window",
      message: "Window cannot exceed 31536000 seconds (1 year)",
      value: windowStr,
    });
  }

  // Parse unit (default to "request")
  const unit = parseUnit(unitStr);
  if (unit.error) {
    return err(unit.error);
  }

  // Parse segment (default to "global")
  const segment = parseSegment(segmentStr);
  if (segment.error) {
    return err(segment.error);
  }

  return ok({
    quota,
    windowSeconds,
    unit: unit.data!,
    segment: segment.data!,
    policyString: trimmed,
  });
}

/**
 * Parse the unit parameter
 */
function parseUnit(
  unitStr: string | undefined
): Result<RateLimitUnit, PolicyValidationError> {
  if (!unitStr) {
    return ok("request");
  }

  const normalized = unitStr.toLowerCase();
  if (normalized === "request" || normalized === "cents") {
    return ok(normalized);
  }

  return err({
    field: "unit",
    message: 'Unit must be "request" or "cents"',
    value: unitStr,
  });
}

/**
 * Parse the segment parameter
 */
function parseSegment(
  segmentStr: string | undefined
): Result<SegmentType, PolicyValidationError> {
  if (!segmentStr) {
    return ok({ type: "global" });
  }

  const normalized = segmentStr.toLowerCase();

  // Check for reserved "user" segment
  if (normalized === "user") {
    return ok({ type: "user" });
  }

  // Validate segment name format (alphanumeric, hyphens, underscores)
  if (!/^[\w-]+$/.test(segmentStr)) {
    return err({
      field: "segment",
      message:
        "Segment name can only contain alphanumeric characters, hyphens, and underscores",
      value: segmentStr,
    });
  }

  // Custom property segment - preserve original case for header matching
  return ok({ type: "property", name: normalized });
}

/**
 * Build a policy string from parsed components
 * Useful for response headers
 */
export function buildPolicyString(policy: ParsedRateLimitPolicy): string {
  let result = `${policy.quota};w=${policy.windowSeconds}`;

  // Only include unit if not default
  if (policy.unit !== "request") {
    result += `;u=${policy.unit}`;
  }

  // Only include segment if not global
  if (policy.segment.type === "user") {
    result += ";s=user";
  } else if (policy.segment.type === "property") {
    result += `;s=${policy.segment.name}`;
  }

  return result;
}

/**
 * Validate a policy without parsing
 * Returns true if the policy string is valid
 */
export function isValidPolicy(
  policyString: string | null | undefined
): boolean {
  const result = parseRateLimitPolicy(policyString);
  return result.error === null;
}
