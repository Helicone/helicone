/**
 * Unit tests for Rate Limit Policy Parser
 *
 * Tests the parsing and validation of Helicone-RateLimit-Policy header format:
 *   [quota];w=[time_window];u=[unit];s=[segment]
 */

import { describe, it, expect } from "vitest";
import {
  parseRateLimitPolicy,
  buildPolicyString,
  isValidPolicy,
} from "../../src/lib/rate-limit/policyParser";

describe("parseRateLimitPolicy", () => {
  describe("valid policies", () => {
    it("parses basic quota and window", () => {
      const result = parseRateLimitPolicy("1000;w=3600");

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        quota: 1000,
        windowSeconds: 3600,
        unit: "request",
        segment: { type: "global" },
        policyString: "1000;w=3600",
      });
    });

    it("parses policy with request unit", () => {
      const result = parseRateLimitPolicy("500;w=60;u=request");

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        quota: 500,
        windowSeconds: 60,
        unit: "request",
        segment: { type: "global" },
        policyString: "500;w=60;u=request",
      });
    });

    it("parses policy with cents unit", () => {
      const result = parseRateLimitPolicy("5000;w=86400;u=cents");

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        quota: 5000,
        windowSeconds: 86400,
        unit: "cents",
        segment: { type: "global" },
        policyString: "5000;w=86400;u=cents",
      });
    });

    it("parses policy with user segment", () => {
      const result = parseRateLimitPolicy("100;w=60;s=user");

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        quota: 100,
        windowSeconds: 60,
        unit: "request",
        segment: { type: "user" },
        policyString: "100;w=60;s=user",
      });
    });

    it("parses policy with custom property segment", () => {
      const result = parseRateLimitPolicy("10000;w=3600;s=organization");

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        quota: 10000,
        windowSeconds: 3600,
        unit: "request",
        segment: { type: "property", name: "organization" },
        policyString: "10000;w=3600;s=organization",
      });
    });

    it("parses policy with all parameters", () => {
      const result = parseRateLimitPolicy("5000;w=3600;u=cents;s=tenant-id");

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        quota: 5000,
        windowSeconds: 3600,
        unit: "cents",
        segment: { type: "property", name: "tenant-id" },
        policyString: "5000;w=3600;u=cents;s=tenant-id",
      });
    });

    it("handles case-insensitive unit", () => {
      const result = parseRateLimitPolicy("100;w=60;u=CENTS");

      expect(result.error).toBeNull();
      expect(result.data?.unit).toBe("cents");
    });

    it("handles case-insensitive segment (user)", () => {
      const result = parseRateLimitPolicy("100;w=60;s=USER");

      expect(result.error).toBeNull();
      expect(result.data?.segment).toEqual({ type: "user" });
    });

    it("trims whitespace from policy string", () => {
      const result = parseRateLimitPolicy("  1000;w=3600  ");

      expect(result.error).toBeNull();
      expect(result.data?.quota).toBe(1000);
    });

    it("handles minimum window of 60 seconds", () => {
      const result = parseRateLimitPolicy("100;w=60");

      expect(result.error).toBeNull();
      expect(result.data?.windowSeconds).toBe(60);
    });

    it("handles large quota values", () => {
      const result = parseRateLimitPolicy("1000000000;w=3600");

      expect(result.error).toBeNull();
      expect(result.data?.quota).toBe(1000000000);
    });

    it("handles decimal quota values for cents", () => {
      const result = parseRateLimitPolicy("0.5;w=60;u=cents");

      expect(result.error).toBeNull();
      expect(result.data?.quota).toBe(0.5);
      expect(result.data?.unit).toBe("cents");
    });

    it("handles decimal quota with multiple decimal places", () => {
      const result = parseRateLimitPolicy("0.125;w=60;u=cents");

      expect(result.error).toBeNull();
      expect(result.data?.quota).toBe(0.125);
    });

    it("handles segment with hyphens and underscores", () => {
      const result = parseRateLimitPolicy("100;w=60;s=my-tenant_id");

      expect(result.error).toBeNull();
      expect(result.data?.segment).toEqual({
        type: "property",
        name: "my-tenant_id",
      });
    });
  });

  describe("null/empty policies", () => {
    it("returns null for null input", () => {
      const result = parseRateLimitPolicy(null);

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it("returns null for undefined input", () => {
      const result = parseRateLimitPolicy(undefined);

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it("returns null for empty string", () => {
      const result = parseRateLimitPolicy("");

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it("returns null for whitespace-only string", () => {
      const result = parseRateLimitPolicy("   ");

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });
  });

  describe("invalid policies", () => {
    it("rejects missing quota", () => {
      const result = parseRateLimitPolicy(";w=3600");

      expect(result.error).not.toBeNull();
      expect(result.error?.field).toBe("policy");
    });

    it("rejects missing window", () => {
      const result = parseRateLimitPolicy("1000");

      expect(result.error).not.toBeNull();
      expect(result.error?.field).toBe("policy");
    });

    it("rejects non-numeric quota", () => {
      const result = parseRateLimitPolicy("abc;w=3600");

      expect(result.error).not.toBeNull();
      expect(result.error?.field).toBe("policy");
    });

    it("rejects negative quota", () => {
      const result = parseRateLimitPolicy("-100;w=3600");

      expect(result.error).not.toBeNull();
      expect(result.error?.field).toBe("policy");
    });

    it("rejects zero quota", () => {
      const result = parseRateLimitPolicy("0;w=3600");

      expect(result.error).not.toBeNull();
      expect(result.error?.field).toBe("quota");
    });

    it("rejects window less than 60 seconds", () => {
      const result = parseRateLimitPolicy("100;w=59");

      expect(result.error).not.toBeNull();
      expect(result.error?.field).toBe("window");
      expect(result.error?.message).toContain("at least 60");
    });

    it("rejects window greater than 1 year", () => {
      const result = parseRateLimitPolicy("100;w=31536001");

      expect(result.error).not.toBeNull();
      expect(result.error?.field).toBe("window");
      expect(result.error?.message).toContain("1 year");
    });

    it("rejects invalid unit", () => {
      const result = parseRateLimitPolicy("100;w=60;u=tokens");

      expect(result.error).not.toBeNull();
      expect(result.error?.field).toBe("policy");
    });

    // Security edge cases
    it("rejects SQL injection attempts", () => {
      const result = parseRateLimitPolicy("100;w=60;s='; DROP TABLE users;--");
      expect(result.error).not.toBeNull();
    });

    it("rejects script injection attempts", () => {
      const result = parseRateLimitPolicy("100;w=60;s=<script>alert(1)</script>");
      expect(result.error).not.toBeNull();
    });

    it("rejects extremely small decimals", () => {
      // Should work but token bucket will handle appropriately
      const result = parseRateLimitPolicy("0.0000001;w=60;u=cents");
      expect(result.error).toBeNull();
      expect(result.data?.quota).toBeCloseTo(0.0000001, 10);
    });

    it("rejects negative via decimal tricks", () => {
      // Regex doesn't allow negative sign
      const result = parseRateLimitPolicy("-0.5;w=60;u=cents");
      expect(result.error).not.toBeNull();
    });

    it("rejects scientific notation", () => {
      // 1e10 should not be parsed as valid
      const result = parseRateLimitPolicy("1e10;w=60");
      expect(result.error).not.toBeNull();
    });

    it("rejects path traversal in segment", () => {
      const result = parseRateLimitPolicy("100;w=60;s=../../../etc/passwd");
      expect(result.error).not.toBeNull();
    });

    it("rejects newlines in policy", () => {
      const result = parseRateLimitPolicy("100;w=60\n;s=user");
      expect(result.error).not.toBeNull();
    });

    it("rejects unicode in segment", () => {
      const result = parseRateLimitPolicy("100;w=60;s=user™");
      expect(result.error).not.toBeNull();
    });

    it("rejects malformed format", () => {
      const result = parseRateLimitPolicy("100:w=60");

      expect(result.error).not.toBeNull();
      expect(result.error?.field).toBe("policy");
    });

    it("rejects extra parameters", () => {
      const result = parseRateLimitPolicy("100;w=60;x=extra");

      expect(result.error).not.toBeNull();
      expect(result.error?.field).toBe("policy");
    });
  });
});

describe("buildPolicyString", () => {
  it("builds basic policy string", () => {
    const policy = {
      quota: 1000,
      windowSeconds: 3600,
      unit: "request" as const,
      segment: { type: "global" as const },
      policyString: "original",
    };

    const result = buildPolicyString(policy);

    expect(result).toBe("1000;w=3600");
  });

  it("includes unit when not request", () => {
    const policy = {
      quota: 5000,
      windowSeconds: 86400,
      unit: "cents" as const,
      segment: { type: "global" as const },
      policyString: "original",
    };

    const result = buildPolicyString(policy);

    expect(result).toBe("5000;w=86400;u=cents");
  });

  it("includes segment when user", () => {
    const policy = {
      quota: 100,
      windowSeconds: 60,
      unit: "request" as const,
      segment: { type: "user" as const },
      policyString: "original",
    };

    const result = buildPolicyString(policy);

    expect(result).toBe("100;w=60;s=user");
  });

  it("includes segment when property", () => {
    const policy = {
      quota: 10000,
      windowSeconds: 3600,
      unit: "request" as const,
      segment: { type: "property" as const, name: "organization" },
      policyString: "original",
    };

    const result = buildPolicyString(policy);

    expect(result).toBe("10000;w=3600;s=organization");
  });

  it("builds full policy string with all parameters", () => {
    const policy = {
      quota: 5000,
      windowSeconds: 3600,
      unit: "cents" as const,
      segment: { type: "property" as const, name: "tenant" },
      policyString: "original",
    };

    const result = buildPolicyString(policy);

    expect(result).toBe("5000;w=3600;u=cents;s=tenant");
  });
});

describe("isValidPolicy", () => {
  it("returns true for valid policies", () => {
    expect(isValidPolicy("1000;w=3600")).toBe(true);
    expect(isValidPolicy("100;w=60;u=cents")).toBe(true);
    expect(isValidPolicy("500;w=86400;s=user")).toBe(true);
  });

  it("returns true for null/empty (no policy)", () => {
    expect(isValidPolicy(null)).toBe(true);
    expect(isValidPolicy(undefined)).toBe(true);
    expect(isValidPolicy("")).toBe(true);
  });

  it("returns false for invalid policies", () => {
    expect(isValidPolicy("invalid")).toBe(false);
    expect(isValidPolicy("100;w=30")).toBe(false);
    expect(isValidPolicy("-100;w=60")).toBe(false);
  });
});
