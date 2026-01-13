/**
 * RateLimiterDO Stress Tests
 *
 * These tests verify the rate limiter behavior under high load conditions
 * and edge cases like window boundaries.
 *
 * Run with: npx vitest run --project unit
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RateLimitRequest, RateLimitResponse } from "../RateLimiterDO";
import { calculateRateLimit } from "../RateLimiterLogic";

/**
 * Mock storage layer for testing.
 * Same as in RateLimiterDO.test.ts - uses the shared calculateRateLimit logic.
 */
class MockRateLimiter {
  private entries: Map<string, { timestamp: number; unitCount: number }[]> =
    new Map();

  processRateLimit(req: RateLimitRequest): RateLimitResponse {
    const now = Date.now();
    const windowStartMs = now - req.timeWindow * 1000;

    let segmentEntries = this.entries.get(req.segmentKey) || [];
    segmentEntries = segmentEntries.filter(
      (entry) => entry.timestamp >= windowStartMs
    );

    const currentUsage = segmentEntries.reduce(
      (sum, entry) => sum + entry.unitCount,
      0
    );

    const unitCount = req.unit === "cents" ? req.cost || 0 : 1;

    const oldestTimestamp =
      segmentEntries.length > 0
        ? Math.min(...segmentEntries.map((e) => e.timestamp))
        : undefined;

    const result = calculateRateLimit({
      currentUsage,
      unitCount,
      quota: req.quota,
      oldestTimestamp,
      timeWindowMs: req.timeWindow * 1000,
      now,
      checkOnly: req.checkOnly ?? false,
    });

    if (!req.checkOnly && !result.wouldExceed) {
      segmentEntries.push({ timestamp: now, unitCount });
    }
    this.entries.set(req.segmentKey, segmentEntries);

    return {
      status: result.wouldExceed ? "rate_limited" : "ok",
      limit: req.quota,
      remaining: result.finalRemaining,
      reset: result.reset,
      currentUsage: result.finalCurrentUsage,
    };
  }

  setEntries(
    segmentKey: string,
    entries: { timestamp: number; unitCount: number }[]
  ) {
    this.entries.set(segmentKey, entries);
  }

  clear() {
    this.entries.clear();
  }
}

describe("RateLimiterDO Stress Tests", () => {
  let rateLimiter: MockRateLimiter;

  beforeEach(() => {
    rateLimiter = new MockRateLimiter();
  });

  describe("High-volume request-based limiting", () => {
    const baseRequest: RateLimitRequest = {
      segmentKey: "stress-test",
      timeWindow: 60,
      quota: 100,
      unit: "request",
      checkOnly: false,
    };

    it("should correctly limit after reaching quota requests", () => {
      // Make 99 requests (one under quota)
      for (let i = 0; i < 99; i++) {
        const result = rateLimiter.processRateLimit(baseRequest);
        expect(result.status).toBe("ok");
      }

      // 100th request: 99 + 1 = 100 >= 100, should be rate limited
      const limitedResult = rateLimiter.processRateLimit(baseRequest);
      expect(limitedResult.status).toBe("rate_limited");
      // remaining shows what was left before this request (1), not after
      expect(limitedResult.remaining).toBe(1);
      expect(limitedResult.currentUsage).toBe(99); // Usage didn't increase
    });

    it("should handle burst of concurrent check requests", () => {
      // First, add 90 requests to get close to the limit
      for (let i = 0; i < 90; i++) {
        rateLimiter.processRateLimit(baseRequest);
      }

      // Now simulate 20 check-only requests
      const checkRequest = { ...baseRequest, checkOnly: true };
      for (let i = 0; i < 20; i++) {
        const result = rateLimiter.processRateLimit(checkRequest);
        expect(result.status).toBe("ok");
        expect(result.remaining).toBe(10); // Should not change
      }
    });

    it("should maintain accuracy under rapid sequential updates", () => {
      const updateCount = 50;

      for (let i = 0; i < updateCount; i++) {
        rateLimiter.processRateLimit(baseRequest);
      }

      const checkResult = rateLimiter.processRateLimit({
        ...baseRequest,
        checkOnly: true,
      });

      expect(checkResult.status).toBe("ok");
      expect(checkResult.remaining).toBe(50); // 100 - 50 = 50
    });
  });

  describe("High-volume cost-based limiting", () => {
    const baseRequest: RateLimitRequest = {
      segmentKey: "cost-stress",
      timeWindow: 30 * 24 * 60 * 60, // 30 days
      quota: 8500, // $85 in cents
      unit: "cents",
      cost: 99, // $0.99
      checkOnly: false,
    };

    it("should correctly track cumulative costs", () => {
      // Simulate 85 requests each costing $0.99 = $84.15 total (8415 cents)
      for (let i = 0; i < 85; i++) {
        rateLimiter.processRateLimit(baseRequest);
      }

      // checkOnly with cost=99 asks: "if I add 99 cents, will I exceed?"
      // 8415 + 99 = 8514 >= 8500, so it's rate limited
      const checkResult = rateLimiter.processRateLimit({
        ...baseRequest,
        checkOnly: true,
      });
      expect(checkResult.status).toBe("rate_limited");
      expect(checkResult.remaining).toBe(85); // 8500 - 8415 = 85 cents left

      // Check with a smaller amount that would fit
      const smallCheckResult = rateLimiter.processRateLimit({
        ...baseRequest,
        cost: 85, // Exactly what's remaining
        checkOnly: true,
      });
      // 8415 + 85 = 8500 >= 8500, still rate limited at exactly quota
      expect(smallCheckResult.status).toBe("rate_limited");

      // Check with amount under remaining
      const okCheckResult = rateLimiter.processRateLimit({
        ...baseRequest,
        cost: 84, // One under remaining
        checkOnly: true,
      });
      // 8415 + 84 = 8499 < 8500, ok
      expect(okCheckResult.status).toBe("ok");
    });

    it("should handle many small transactions", () => {
      // Make 8499 requests each costing 1 cent (just under quota)
      const smallRequest: RateLimitRequest = {
        ...baseRequest,
        cost: 1, // 1 cent
      };

      for (let i = 0; i < 8499; i++) {
        const result = rateLimiter.processRateLimit(smallRequest);
        expect(result.status).toBe("ok");
      }

      // 8500th cent: 8499 + 1 = 8500 >= 8500, should be rate limited
      const limitedResult = rateLimiter.processRateLimit(smallRequest);
      expect(limitedResult.status).toBe("rate_limited");
      // remaining shows what was left before (1 cent)
      expect(limitedResult.remaining).toBe(1);
      expect(limitedResult.currentUsage).toBe(8499);
    });
  });

  describe("Multi-segment stress testing", () => {
    it("should handle many different segments simultaneously", () => {
      const userCount = 100;
      const requestsPerUser = 5;

      // Simulate 100 different users each making 5 requests
      for (let user = 0; user < userCount; user++) {
        const request: RateLimitRequest = {
          segmentKey: `user-${user}`,
          timeWindow: 60,
          quota: 10,
          unit: "request",
          checkOnly: false,
        };

        for (let req = 0; req < requestsPerUser; req++) {
          rateLimiter.processRateLimit(request);
        }
      }

      // Check each user has independent limits
      for (let user = 0; user < userCount; user++) {
        const checkRequest: RateLimitRequest = {
          segmentKey: `user-${user}`,
          timeWindow: 60,
          quota: 10,
          unit: "request",
          checkOnly: true,
        };

        const result = rateLimiter.processRateLimit(checkRequest);
        expect(result.status).toBe("ok");
        expect(result.remaining).toBe(5); // 10 - 5 = 5
      }
    });
  });

  describe("Window boundary stress testing", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should correctly handle requests spanning window boundaries", () => {
      const request: RateLimitRequest = {
        segmentKey: "window-boundary",
        timeWindow: 60,
        quota: 10,
        unit: "request",
        checkOnly: false,
      };

      // Make 9 requests (one under quota)
      for (let i = 0; i < 9; i++) {
        rateLimiter.processRateLimit(request);
      }

      // 10th request: 9 + 1 = 10 >= 10, should be rate limited
      let result = rateLimiter.processRateLimit(request);
      expect(result.status).toBe("rate_limited");
      // remaining shows what was left before (1)
      expect(result.remaining).toBe(1);

      // Advance time by 61 seconds (past the window)
      vi.advanceTimersByTime(61000);

      // Should be reset now
      result = rateLimiter.processRateLimit(request);
      expect(result.status).toBe("ok");
      expect(result.remaining).toBe(9); // New request added
    });

    it("should handle gradual window sliding", () => {
      const request: RateLimitRequest = {
        segmentKey: "sliding-window",
        timeWindow: 60,
        quota: 5,
        unit: "request",
        checkOnly: false,
      };

      // Make 4 requests over 40 seconds
      // Request 1 at t=0, Request 2 at t=10, Request 3 at t=20, Request 4 at t=30
      for (let i = 0; i < 4; i++) {
        rateLimiter.processRateLimit(request);
        vi.advanceTimersByTime(10000);
      }
      // Now at t=40

      // 5th request: 4 + 1 = 5 >= 5, should be rate limited
      let result = rateLimiter.processRateLimit(request);
      expect(result.status).toBe("rate_limited");
      // remaining shows what was left before (1)
      expect(result.remaining).toBe(1);

      // Advance 30 more seconds (now at t=70)
      // Window is [t=10, t=70), entries with timestamp >= windowStart are kept
      // Request 1 at t=0: excluded (0 < 10)
      // Request 2 at t=10: included (10 >= 10) - boundary is inclusive
      // Request 3 at t=20: included
      // Request 4 at t=30: included
      vi.advanceTimersByTime(30000);

      result = rateLimiter.processRateLimit({ ...request, checkOnly: true });
      // 3 requests remain in window (requests 2-4 from t=10,20,30)
      // remaining = 5 - 3 = 2
      expect(result.status).toBe("ok");
      expect(result.remaining).toBe(2);
    });

    it("should handle very long time windows (30 days)", () => {
      const request: RateLimitRequest = {
        segmentKey: "long-window",
        timeWindow: 30 * 24 * 60 * 60, // 30 days
        quota: 8500,
        unit: "cents",
        cost: 2000, // $20
        checkOnly: false,
      };

      // Add $20 at day 1
      rateLimiter.processRateLimit(request);

      // Advance to day 15 and add another $20
      vi.advanceTimersByTime(15 * 24 * 60 * 60 * 1000);
      rateLimiter.processRateLimit(request);

      // Advance to day 29 and add another $20
      vi.advanceTimersByTime(14 * 24 * 60 * 60 * 1000);
      rateLimiter.processRateLimit(request);

      // Total: $60 (6000 cents)
      let result = rateLimiter.processRateLimit({
        ...request,
        checkOnly: true,
      });
      expect(result.status).toBe("ok");
      expect(result.remaining).toBe(2500); // 8500 - 6000 = 2500

      // Advance to day 32 (first $20 falls out of window)
      vi.advanceTimersByTime(3 * 24 * 60 * 60 * 1000);

      result = rateLimiter.processRateLimit({ ...request, checkOnly: true });
      // Only $40 (4000 cents) remains in window
      expect(result.remaining).toBe(4500); // 8500 - 4000 = 4500
    });
  });

  describe("Performance benchmarks", () => {
    it("should complete 1000 operations quickly", () => {
      const request: RateLimitRequest = {
        segmentKey: "perf-benchmark",
        timeWindow: 60,
        quota: 10000,
        unit: "request",
        checkOnly: false,
      };

      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        rateLimiter.processRateLimit(request);
      }

      const duration = performance.now() - startTime;

      // Should complete in under 100ms (very fast for in-memory mock)
      expect(duration).toBeLessThan(100);
      console.log(`1000 operations completed in ${duration.toFixed(2)}ms`);
    });

    it("should handle mixed operations efficiently", () => {
      const startTime = performance.now();

      for (let i = 0; i < 500; i++) {
        // Alternate between check and update
        const request: RateLimitRequest = {
          segmentKey: `segment-${i % 10}`,
          timeWindow: 60,
          quota: 1000,
          unit: i % 2 === 0 ? "request" : "cents",
          cost: i % 2 === 0 ? undefined : 10,
          checkOnly: i % 3 === 0,
        };
        rateLimiter.processRateLimit(request);
      }

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(50);
      console.log(`500 mixed operations completed in ${duration.toFixed(2)}ms`);
    });
  });
});
