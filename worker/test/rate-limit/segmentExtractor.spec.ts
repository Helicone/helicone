/**
 * Unit tests for Segment Extractor
 *
 * Tests extraction of segment identifiers from request headers
 * and building of Durable Object keys.
 */

import { describe, it, expect } from "vitest";
import {
  extractSegmentIdentifier,
  buildDurableObjectKey,
  createPropertySourceFromHeaders,
} from "../../src/lib/rate-limit/segmentExtractor";
import { SegmentType } from "../../src/lib/rate-limit/policyParser";

describe("extractSegmentIdentifier", () => {
  describe("global segment", () => {
    it("extracts global segment", () => {
      const segment: SegmentType = { type: "global" };
      const source = createPropertySourceFromHeaders({}, undefined);

      const result = extractSegmentIdentifier(segment, source);

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        type: "global",
        value: "",
      });
    });

    it("extracts global segment even with properties present", () => {
      const segment: SegmentType = { type: "global" };
      const source = createPropertySourceFromHeaders(
        { organization: "org_123" },
        "user_456"
      );

      const result = extractSegmentIdentifier(segment, source);

      expect(result.error).toBeNull();
      expect(result.data?.type).toBe("global");
    });
  });

  describe("user segment", () => {
    it("extracts user segment with valid userId", () => {
      const segment: SegmentType = { type: "user" };
      const source = createPropertySourceFromHeaders({}, "user_12345");

      const result = extractSegmentIdentifier(segment, source);

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        type: "user",
        value: "user_12345",
      });
    });

    it("fails when userId is missing", () => {
      const segment: SegmentType = { type: "user" };
      const source = createPropertySourceFromHeaders({}, undefined);

      const result = extractSegmentIdentifier(segment, source);

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("MISSING_USER_ID");
      expect(result.error?.message).toContain("Helicone-User-Id");
    });

    it("fails when userId is empty string", () => {
      const segment: SegmentType = { type: "user" };
      const source = createPropertySourceFromHeaders({}, "");

      const result = extractSegmentIdentifier(segment, source);

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("MISSING_USER_ID");
    });

    it("sanitizes colons in userId", () => {
      const segment: SegmentType = { type: "user" };
      const source = createPropertySourceFromHeaders({}, "user:with:colons");

      const result = extractSegmentIdentifier(segment, source);

      expect(result.error).toBeNull();
      expect(result.data?.value).toBe("user_with_colons");
    });

    it("truncates very long userIds", () => {
      const segment: SegmentType = { type: "user" };
      const longId = "a".repeat(300);
      const source = createPropertySourceFromHeaders({}, longId);

      const result = extractSegmentIdentifier(segment, source);

      expect(result.error).toBeNull();
      expect(result.data?.value.length).toBeLessThanOrEqual(256);
    });
  });

  describe("property segment", () => {
    it("extracts property segment with matching header", () => {
      const segment: SegmentType = { type: "property", name: "organization" };
      const source = createPropertySourceFromHeaders(
        { organization: "org_789" },
        undefined
      );

      const result = extractSegmentIdentifier(segment, source);

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        type: "property",
        propertyName: "organization",
        value: "org_789",
      });
    });

    it("performs case-insensitive property lookup", () => {
      const segment: SegmentType = { type: "property", name: "Organization" };
      const source = createPropertySourceFromHeaders(
        { organization: "org_123" },
        undefined
      );

      const result = extractSegmentIdentifier(segment, source);

      expect(result.error).toBeNull();
      expect(result.data?.value).toBe("org_123");
    });

    it("fails when property header is missing", () => {
      const segment: SegmentType = { type: "property", name: "tenant" };
      const source = createPropertySourceFromHeaders(
        { organization: "org_123" },
        undefined
      );

      const result = extractSegmentIdentifier(segment, source);

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("MISSING_PROPERTY");
      expect(result.error?.message).toContain("Helicone-Property-Tenant");
    });

    it("sanitizes property values", () => {
      const segment: SegmentType = { type: "property", name: "tenant" };
      const source = createPropertySourceFromHeaders(
        { tenant: "value:with:colons" },
        undefined
      );

      const result = extractSegmentIdentifier(segment, source);

      expect(result.error).toBeNull();
      expect(result.data?.value).toBe("value_with_colons");
    });

    it("handles hyphenated property names", () => {
      const segment: SegmentType = { type: "property", name: "tenant-id" };
      const source = createPropertySourceFromHeaders(
        { "tenant-id": "tid_123" },
        undefined
      );

      const result = extractSegmentIdentifier(segment, source);

      expect(result.error).toBeNull();
      expect(result.data?.propertyName).toBe("tenant-id");
      expect(result.data?.value).toBe("tid_123");
    });
  });
});

describe("buildDurableObjectKey", () => {
  describe("global keys", () => {
    it("builds global key for requests", () => {
      const segment = { type: "global" as const, value: "" };
      const key = buildDurableObjectKey("org_123", segment, "request");

      expect(key).toBe("tb:org_123:global::request");
    });

    it("builds global key for cents", () => {
      const segment = { type: "global" as const, value: "" };
      const key = buildDurableObjectKey("org_456", segment, "cents");

      expect(key).toBe("tb:org_456:global::cents");
    });
  });

  describe("user keys", () => {
    it("builds user key for requests", () => {
      const segment = { type: "user" as const, value: "user_789" };
      const key = buildDurableObjectKey("org_123", segment, "request");

      expect(key).toBe("tb:org_123:user:user_789:request");
    });

    it("builds user key for cents", () => {
      const segment = { type: "user" as const, value: "user_101" };
      const key = buildDurableObjectKey("org_123", segment, "cents");

      expect(key).toBe("tb:org_123:user:user_101:cents");
    });
  });

  describe("property keys", () => {
    it("builds property key for requests", () => {
      const segment = {
        type: "property" as const,
        propertyName: "organization",
        value: "org_sub_123",
      };
      const key = buildDurableObjectKey("org_123", segment, "request");

      expect(key).toBe("tb:org_123:prop:organization:org_sub_123:request");
    });

    it("builds property key for cents", () => {
      const segment = {
        type: "property" as const,
        propertyName: "tenant",
        value: "tid_456",
      };
      const key = buildDurableObjectKey("org_123", segment, "cents");

      expect(key).toBe("tb:org_123:prop:tenant:tid_456:cents");
    });

    it("sanitizes organization ID in key", () => {
      const segment = { type: "global" as const, value: "" };
      const key = buildDurableObjectKey("org:with:colons", segment, "request");

      expect(key).toBe("tb:org_with_colons:global::request");
    });
  });

  describe("key uniqueness", () => {
    it("generates different keys for different units", () => {
      const segment = { type: "global" as const, value: "" };

      const requestKey = buildDurableObjectKey("org_123", segment, "request");
      const centsKey = buildDurableObjectKey("org_123", segment, "cents");

      expect(requestKey).not.toBe(centsKey);
    });

    it("generates different keys for different organizations", () => {
      const segment = { type: "user" as const, value: "user_123" };

      const key1 = buildDurableObjectKey("org_1", segment, "request");
      const key2 = buildDurableObjectKey("org_2", segment, "request");

      expect(key1).not.toBe(key2);
    });

    it("generates different keys for different segment values", () => {
      const segment1 = { type: "user" as const, value: "user_1" };
      const segment2 = { type: "user" as const, value: "user_2" };

      const key1 = buildDurableObjectKey("org_123", segment1, "request");
      const key2 = buildDurableObjectKey("org_123", segment2, "request");

      expect(key1).not.toBe(key2);
    });

    it("generates different keys for different property names", () => {
      const segment1 = {
        type: "property" as const,
        propertyName: "tenant",
        value: "same",
      };
      const segment2 = {
        type: "property" as const,
        propertyName: "organization",
        value: "same",
      };

      const key1 = buildDurableObjectKey("org_123", segment1, "request");
      const key2 = buildDurableObjectKey("org_123", segment2, "request");

      expect(key1).not.toBe(key2);
    });
  });
});

describe("createPropertySourceFromHeaders", () => {
  it("provides case-insensitive property lookup", () => {
    const source = createPropertySourceFromHeaders(
      {
        Organization: "org_123",
        "TENANT-ID": "tid_456",
        lowercase: "val_789",
      },
      "user_123"
    );

    expect(source.getProperty("organization")).toBe("org_123");
    expect(source.getProperty("ORGANIZATION")).toBe("org_123");
    expect(source.getProperty("tenant-id")).toBe("tid_456");
    expect(source.getProperty("Tenant-ID")).toBe("tid_456");
    expect(source.getProperty("lowercase")).toBe("val_789");
  });

  it("returns undefined for missing properties", () => {
    const source = createPropertySourceFromHeaders(
      { existing: "value" },
      "user_123"
    );

    expect(source.getProperty("nonexistent")).toBeUndefined();
  });

  it("provides user ID", () => {
    const source = createPropertySourceFromHeaders({}, "user_12345");

    expect(source.getUserId()).toBe("user_12345");
  });

  it("returns undefined for missing user ID", () => {
    const source = createPropertySourceFromHeaders({}, undefined);

    expect(source.getUserId()).toBeUndefined();
  });
});
