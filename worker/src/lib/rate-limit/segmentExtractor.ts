/**
 * Segment Extractor for Rate Limiting
 *
 * Extracts segment identifiers from request headers based on the policy segment type.
 *
 * Segment types:
 * - global: One shared bucket per organization (no additional identifier needed)
 * - user: Per-user bucket using Helicone-User-Id header
 * - property: Per-property bucket using Helicone-Property-[Name] header
 *
 * DO Key Format:
 *   tb:<organizationId>:<segmentType>:<segmentValue>:<unit>
 *
 * Examples:
 *   - tb:org_123:global::request
 *   - tb:org_123:user:user_456:request
 *   - tb:org_123:prop:organization:org_789:cents
 */

import { Result, err, ok } from "../util/results";
import { SegmentType } from "./policyParser";

export interface SegmentIdentifier {
  /** Segment type for DO key */
  type: "global" | "user" | "property";
  /** Property name (only for property type) */
  propertyName?: string;
  /** The extracted value (empty for global) */
  value: string;
}

export interface SegmentExtractionError {
  code: "MISSING_USER_ID" | "MISSING_PROPERTY" | "INVALID_SEGMENT";
  message: string;
  segment: SegmentType;
}

export interface HeliconePropertySource {
  /** Get a property value by name (case-insensitive) */
  getProperty(name: string): string | undefined;
  /** Get the user ID */
  getUserId(): string | undefined;
}

/**
 * Extract segment identifier from headers based on policy segment type
 *
 * @param segment - The segment type from the parsed policy
 * @param source - Source for extracting header values
 * @returns Segment identifier or extraction error
 */
export function extractSegmentIdentifier(
  segment: SegmentType,
  source: HeliconePropertySource
): Result<SegmentIdentifier, SegmentExtractionError> {
  switch (segment.type) {
    case "global":
      return ok({
        type: "global",
        value: "",
      });

    case "user": {
      const userId = source.getUserId();
      if (!userId) {
        return err({
          code: "MISSING_USER_ID",
          message:
            'Rate limit policy specifies "s=user" but Helicone-User-Id header is missing',
          segment,
        });
      }
      return ok({
        type: "user",
        value: sanitizeSegmentValue(userId),
      });
    }

    case "property": {
      const propertyValue = source.getProperty(segment.name);
      if (!propertyValue) {
        return err({
          code: "MISSING_PROPERTY",
          message: `Rate limit policy specifies "s=${segment.name}" but Helicone-Property-${capitalize(segment.name)} header is missing`,
          segment,
        });
      }
      return ok({
        type: "property",
        propertyName: segment.name,
        value: sanitizeSegmentValue(propertyValue),
      });
    }

    default:
      return err({
        code: "INVALID_SEGMENT",
        message: `Unknown segment type`,
        segment,
      });
  }
}

/**
 * Build a Durable Object key for the rate limiter
 *
 * Format: tb:<organizationId>:<segmentType>:<propertyName?>:<segmentValue>:<unit>
 *
 * This ensures unique buckets per:
 * - Organization (isolation between customers)
 * - Segment type (global vs user vs property)
 * - Property name (for property-based segments)
 * - Segment value (the actual identifier)
 * - Unit (request vs cents have separate buckets)
 */
export function buildDurableObjectKey(
  organizationId: string,
  segmentId: SegmentIdentifier,
  unit: "request" | "cents"
): string {
  const parts = ["tb", sanitizeKeyPart(organizationId)];

  switch (segmentId.type) {
    case "global":
      parts.push("global", "", unit);
      break;
    case "user":
      parts.push("user", segmentId.value, unit);
      break;
    case "property":
      parts.push(
        "prop",
        sanitizeKeyPart(segmentId.propertyName || ""),
        segmentId.value,
        unit
      );
      break;
  }

  return parts.join(":");
}

/**
 * Create a property source from Helicone headers
 */
export function createPropertySourceFromHeaders(
  heliconeProperties: Record<string, string>,
  userId: string | undefined
): HeliconePropertySource {
  // Create a lowercase map for case-insensitive property lookup
  const lowerCaseProps: Record<string, string> = {};
  for (const [key, value] of Object.entries(heliconeProperties)) {
    lowerCaseProps[key.toLowerCase()] = value;
  }

  return {
    getProperty(name: string): string | undefined {
      return lowerCaseProps[name.toLowerCase()];
    },
    getUserId(): string | undefined {
      return userId;
    },
  };
}

// --- Helper functions ---

/**
 * Sanitize segment values to prevent injection in DO keys
 * Removes/escapes characters that could cause issues
 */
function sanitizeSegmentValue(value: string): string {
  // Remove colons (used as key separator), control characters, and trim
  // eslint-disable-next-line no-control-regex
  const controlCharsRegex = /[\u0000-\u001f\u007f]/g;
  return value
    .replace(/:/g, "_")
    .replace(controlCharsRegex, "")
    .trim()
    .slice(0, 256); // Limit length to prevent abuse
}

/**
 * Sanitize key parts (more aggressive than segment values)
 */
function sanitizeKeyPart(value: string): string {
  // Only allow alphanumeric, underscore, hyphen
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 128);
}

/**
 * Capitalize first letter (for error messages)
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
