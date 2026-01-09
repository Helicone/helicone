/**
 * RateLimiterDO Tests
 *
 * These tests verify the Durable Object rate limiter logic for both
 * request-based and cost-based (cents) limiting.
 *
 * Note: These are unit tests that test the logic directly.
 * For integration testing with actual Durable Objects, see the stress test suite.
 */

import { RateLimitRequest, RateLimitResponse } from "../RateLimiterDO";

/**
 * Mock implementation of the rate limiter logic for testing.
 * This mirrors the actual RateLimiterDO.processRateLimit logic
 * but can be tested without Cloudflare Workers infrastructure.
 */
class MockRateLimiter {
  private entries: Map<string, { timestamp: number; unitCount: number }[]> =
    new Map();

  processRateLimit(req: RateLimitRequest): RateLimitResponse {
    const now = Date.now();
    const windowStartMs = now - req.timeWindow * 1000;

    // Get or create entry list for this segment
    let segmentEntries = this.entries.get(req.segmentKey) || [];

    // Clean up old entries outside the window
    segmentEntries = segmentEntries.filter(
      (entry) => entry.timestamp >= windowStartMs
    );

    // Get current usage within the window
    const currentUsage = segmentEntries.reduce(
      (sum, entry) => sum + entry.unitCount,
      0
    );

    // Calculate the unit count for this request
    const unitCount = req.unit === "cents" ? req.cost || 0 : 1;

    // Check if adding this request would exceed the quota
    // Using > (not >=) because at exactly the quota, the user should still have access
    // Both checkOnly and update modes use the same logic: would this request exceed?
    const wouldExceed = currentUsage + unitCount > req.quota;

    const remaining = Math.max(0, req.quota - currentUsage);

    // If not check-only and not rate limited, record the usage
    if (!req.checkOnly && !wouldExceed) {
      segmentEntries.push({ timestamp: now, unitCount });
      this.entries.set(req.segmentKey, segmentEntries);
    }

    // Calculate reset time
    let reset: number | undefined;
    if (segmentEntries.length > 0) {
      const oldestTimestamp = Math.min(
        ...segmentEntries.map((e) => e.timestamp)
      );
      reset = Math.ceil((oldestTimestamp + req.timeWindow * 1000 - now) / 1000);
      reset = Math.max(0, reset);
    }

    const finalRemaining = wouldExceed
      ? remaining
      : Math.max(0, remaining - unitCount);
    const finalCurrentUsage = wouldExceed
      ? currentUsage
      : currentUsage + unitCount;

    return {
      status: wouldExceed ? "rate_limited" : "ok",
      limit: req.quota,
      remaining: finalRemaining,
      reset,
      currentUsage: finalCurrentUsage,
    };
  }

  // Helper to set up initial state for testing
  setEntries(
    segmentKey: string,
    entries: { timestamp: number; unitCount: number }[]
  ) {
    this.entries.set(segmentKey, entries);
  }

  // Helper to clear state between tests
  clear() {
    this.entries.clear();
  }
}

describe("RateLimiterDO Logic", () => {
  let rateLimiter: MockRateLimiter;

  beforeEach(() => {
    rateLimiter = new MockRateLimiter();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("request-based limiting", () => {
    const baseRequest: RateLimitRequest = {
      segmentKey: "global",
      timeWindow: 60, // 1 minute
      quota: 10,
      unit: "request",
      checkOnly: false,
    };

    it("should allow requests when under limit", () => {
      // Set up 5 existing requests
      const now = Date.now();
      rateLimiter.setEntries(
        "global",
        Array.from({ length: 5 }, (_, i) => ({
          timestamp: now - i * 1000,
          unitCount: 1,
        }))
      );

      const result = rateLimiter.processRateLimit(baseRequest);

      expect(result.status).toBe("ok");
      expect(result.currentUsage).toBe(6); // 5 existing + 1 new
      expect(result.remaining).toBe(4); // 10 - 6 = 4
    });

    it("should allow requests when at exactly the limit", () => {
      // Set up 9 existing requests (one under quota)
      const now = Date.now();
      rateLimiter.setEntries(
        "global",
        Array.from({ length: 9 }, (_, i) => ({
          timestamp: now - i * 1000,
          unitCount: 1,
        }))
      );

      // With 9 existing, adding 1 would make 10 which equals quota
      // 10 > 10 is false, so should allow
      const checkResult = rateLimiter.processRateLimit({
        ...baseRequest,
        checkOnly: true,
      });
      expect(checkResult.status).toBe("ok");

      // Actually add the request
      const updateResult = rateLimiter.processRateLimit(baseRequest);
      expect(updateResult.status).toBe("ok");
      expect(updateResult.currentUsage).toBe(10);

      // Now at exactly 10, trying to add another would make 11 > 10
      const overLimitResult = rateLimiter.processRateLimit(baseRequest);
      expect(overLimitResult.status).toBe("rate_limited");
      expect(overLimitResult.currentUsage).toBe(10); // Should not increase
    });

    it("should rate limit when over the limit", () => {
      // Set up 10 existing requests, then try to add another
      const now = Date.now();
      rateLimiter.setEntries(
        "global",
        Array.from({ length: 10 }, (_, i) => ({
          timestamp: now - i * 1000,
          unitCount: 1,
        }))
      );

      const result = rateLimiter.processRateLimit(baseRequest);

      // 10 existing + 1 new = 11, which is > 10 quota
      expect(result.status).toBe("rate_limited");
      expect(result.currentUsage).toBe(10); // Should not increase
      expect(result.remaining).toBe(0);
    });

    it("should allow requests when no history exists", () => {
      const result = rateLimiter.processRateLimit(baseRequest);

      expect(result.status).toBe("ok");
      expect(result.currentUsage).toBe(1);
      expect(result.remaining).toBe(9);
    });

    it("should ignore requests outside the time window", () => {
      // All requests are outside the 1 minute window
      const now = Date.now();
      rateLimiter.setEntries(
        "global",
        Array.from({ length: 15 }, (_, i) => ({
          timestamp: now - (70 + i) * 1000, // 70+ seconds ago
          unitCount: 1,
        }))
      );

      const result = rateLimiter.processRateLimit(baseRequest);

      expect(result.status).toBe("ok");
      expect(result.currentUsage).toBe(1); // Only the new request
      expect(result.remaining).toBe(9);
    });
  });

  describe("cost-based (cents) limiting", () => {
    const baseRequest: RateLimitRequest = {
      segmentKey: "global",
      timeWindow: 30 * 24 * 60 * 60, // 30 days
      quota: 8500, // $85 in cents
      unit: "cents",
      cost: 100, // $1 in cents
      checkOnly: false,
    };

    it("should allow requests when spending is under limit", () => {
      // Set up $62 existing spend
      const now = Date.now();
      rateLimiter.setEntries("global", [
        { timestamp: now - 1000, unitCount: 3200 }, // $32
        { timestamp: now - 2000, unitCount: 3000 }, // $30
      ]);

      const result = rateLimiter.processRateLimit({
        ...baseRequest,
        cost: 100, // $1
      });

      expect(result.status).toBe("ok");
      expect(result.currentUsage).toBe(6300); // 6200 + 100
      expect(result.remaining).toBe(2200); // 8500 - 6300 = 2200
    });

    it("should allow requests when spending is exactly at limit", () => {
      // Set up exactly $84 existing spend
      const now = Date.now();
      rateLimiter.setEntries("global", [
        { timestamp: now - 1000, unitCount: 5000 }, // $50
        { timestamp: now - 2000, unitCount: 3400 }, // $34
      ]);

      // Adding $1 (100 cents) makes it $85 exactly (8500 cents)
      const result = rateLimiter.processRateLimit({
        ...baseRequest,
        cost: 100, // $1
      });

      // 8400 + 100 = 8500, which is NOT > 8500, so allowed
      expect(result.status).toBe("ok");
      expect(result.currentUsage).toBe(8500);
    });

    it("should rate limit when spending exceeds limit", () => {
      // Set up exactly $85 existing spend
      const now = Date.now();
      rateLimiter.setEntries("global", [
        { timestamp: now - 1000, unitCount: 5000 }, // $50
        { timestamp: now - 2000, unitCount: 3500 }, // $35
      ]);

      // Adding any cost would exceed
      const result = rateLimiter.processRateLimit({
        ...baseRequest,
        cost: 1, // $0.01
      });

      // 8500 + 1 = 8501 > 8500 quota
      expect(result.status).toBe("rate_limited");
      expect(result.currentUsage).toBe(8500);
      expect(result.remaining).toBe(0);
    });

    it("should handle the user scenario: $62 spent of $85 limit", () => {
      // This is the specific scenario from the bug report
      const now = Date.now();
      rateLimiter.setEntries("global", [
        { timestamp: now - 1000, unitCount: 6200 }, // $62
      ]);

      // Check-only mode: should return ok because 6200 < 8500
      const checkResult = rateLimiter.processRateLimit({
        ...baseRequest,
        checkOnly: true,
      });

      expect(checkResult.status).toBe("ok");
      expect(checkResult.remaining).toBe(2300); // $23 remaining
    });

    it("should reset spending when window expires", () => {
      // Spending from 31 days ago (outside the 30-day window)
      const now = Date.now();
      const oldTimestamp = now - 31 * 24 * 60 * 60 * 1000;
      rateLimiter.setEntries("global", [
        { timestamp: oldTimestamp, unitCount: 8500 }, // $85 spent but outside window
      ]);

      const result = rateLimiter.processRateLimit({
        ...baseRequest,
        cost: 100,
      });

      expect(result.status).toBe("ok");
      expect(result.currentUsage).toBe(100); // Only the new cost
      expect(result.remaining).toBe(8400);
    });
  });

  describe("checkOnly mode", () => {
    const baseRequest: RateLimitRequest = {
      segmentKey: "global",
      timeWindow: 60,
      quota: 10,
      unit: "request",
      checkOnly: true,
    };

    it("should not add to usage in checkOnly mode", () => {
      const now = Date.now();
      rateLimiter.setEntries(
        "global",
        Array.from({ length: 5 }, (_, i) => ({
          timestamp: now - i * 1000,
          unitCount: 1,
        }))
      );

      const result = rateLimiter.processRateLimit(baseRequest);

      expect(result.status).toBe("ok");
      expect(result.currentUsage).toBe(5); // Should NOT increase
      expect(result.remaining).toBe(5);

      // Call again to verify no state change
      const secondResult = rateLimiter.processRateLimit(baseRequest);
      expect(secondResult.currentUsage).toBe(5);
    });

    it("should return rate_limited when request would exceed quota in checkOnly mode", () => {
      const now = Date.now();

      // With 10 existing, adding 1 would make 11 > 10 quota
      rateLimiter.setEntries(
        "global",
        Array.from({ length: 10 }, (_, i) => ({
          timestamp: now - i * 1000,
          unitCount: 1,
        }))
      );

      const result = rateLimiter.processRateLimit(baseRequest);
      expect(result.status).toBe("rate_limited");

      // With 11 existing (already over), adding 1 would make 12 > 10
      rateLimiter.clear();
      rateLimiter.setEntries(
        "global",
        Array.from({ length: 11 }, (_, i) => ({
          timestamp: now - i * 1000,
          unitCount: 1,
        }))
      );

      const overResult = rateLimiter.processRateLimit(baseRequest);
      expect(overResult.status).toBe("rate_limited");
    });

    it("should return ok when under quota in checkOnly mode", () => {
      const now = Date.now();
      rateLimiter.setEntries(
        "global",
        Array.from({ length: 9 }, (_, i) => ({
          timestamp: now - i * 1000,
          unitCount: 1,
        }))
      );

      const result = rateLimiter.processRateLimit(baseRequest);
      expect(result.status).toBe("ok");
      expect(result.remaining).toBe(1);
    });
  });

  describe("edge cases", () => {
    it("should handle zero quota", () => {
      const request: RateLimitRequest = {
        segmentKey: "global",
        timeWindow: 60,
        quota: 0,
        unit: "request",
        checkOnly: false,
      };

      const result = rateLimiter.processRateLimit(request);

      // 0 + 1 > 0, so rate limited
      expect(result.status).toBe("rate_limited");
    });

    it("should handle very large quotas", () => {
      const request: RateLimitRequest = {
        segmentKey: "global",
        timeWindow: 60,
        quota: Number.MAX_SAFE_INTEGER,
        unit: "request",
        checkOnly: false,
      };

      const result = rateLimiter.processRateLimit(request);

      expect(result.status).toBe("ok");
      expect(result.remaining).toBe(Number.MAX_SAFE_INTEGER - 1);
    });

    it("should handle fractional costs", () => {
      const request: RateLimitRequest = {
        segmentKey: "global",
        timeWindow: 60,
        quota: 100,
        unit: "cents",
        cost: 0.5, // Half a cent
        checkOnly: false,
      };

      const result = rateLimiter.processRateLimit(request);

      expect(result.status).toBe("ok");
      expect(result.currentUsage).toBe(0.5);
      expect(result.remaining).toBe(99.5);
    });

    it("should handle multiple segments independently", () => {
      const now = Date.now();

      // Set up different usage for different segments
      rateLimiter.setEntries(
        "user=alice",
        Array.from({ length: 5 }, (_, i) => ({
          timestamp: now - i * 1000,
          unitCount: 1,
        }))
      );
      rateLimiter.setEntries(
        "user=bob",
        Array.from({ length: 9 }, (_, i) => ({
          timestamp: now - i * 1000,
          unitCount: 1,
        }))
      );

      const aliceResult = rateLimiter.processRateLimit({
        segmentKey: "user=alice",
        timeWindow: 60,
        quota: 10,
        unit: "request",
        checkOnly: true,
      });

      const bobResult = rateLimiter.processRateLimit({
        segmentKey: "user=bob",
        timeWindow: 60,
        quota: 10,
        unit: "request",
        checkOnly: true,
      });

      expect(aliceResult.status).toBe("ok");
      expect(aliceResult.remaining).toBe(5);
      expect(bobResult.status).toBe("ok");
      expect(bobResult.remaining).toBe(1);
    });

    it("should calculate correct reset time", () => {
      const now = Date.now();
      const oldestTimestamp = now - 30000; // 30 seconds ago

      rateLimiter.setEntries("global", [
        { timestamp: oldestTimestamp, unitCount: 5 },
        { timestamp: now - 10000, unitCount: 5 }, // 10 seconds ago
      ]);

      const result = rateLimiter.processRateLimit({
        segmentKey: "global",
        timeWindow: 60,
        quota: 10,
        unit: "request",
        checkOnly: true,
      });

      // Reset should be approximately 30 seconds from now
      // (when the oldest entry falls out of the 60-second window)
      expect(result.reset).toBeGreaterThanOrEqual(29);
      expect(result.reset).toBeLessThanOrEqual(31);
    });
  });

  describe("concurrent access simulation", () => {
    it("should handle rapid sequential requests correctly", () => {
      const request: RateLimitRequest = {
        segmentKey: "global",
        timeWindow: 60,
        quota: 5,
        unit: "request",
        checkOnly: false,
      };

      // Simulate 5 rapid requests
      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.processRateLimit(request);
        expect(result.status).toBe("ok");
        expect(result.currentUsage).toBe(i + 1);
      }

      // 6th request should be rate limited
      const limitedResult = rateLimiter.processRateLimit(request);
      expect(limitedResult.status).toBe("rate_limited");
      expect(limitedResult.currentUsage).toBe(5);
    });

    it("should handle check-then-update pattern correctly", () => {
      const checkRequest: RateLimitRequest = {
        segmentKey: "global",
        timeWindow: 60,
        quota: 5,
        unit: "request",
        checkOnly: true,
      };

      const updateRequest: RateLimitRequest = {
        ...checkRequest,
        checkOnly: false,
      };

      // Check first (should be ok)
      const checkResult = rateLimiter.processRateLimit(checkRequest);
      expect(checkResult.status).toBe("ok");

      // Then update
      const updateResult = rateLimiter.processRateLimit(updateRequest);
      expect(updateResult.status).toBe("ok");
      expect(updateResult.currentUsage).toBe(1);
    });
  });
});
