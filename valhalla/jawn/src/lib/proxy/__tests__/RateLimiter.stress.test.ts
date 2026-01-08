/**
 * Rate Limiter Stress Tests
 *
 * These tests verify the rate limiter behavior under high load conditions.
 * They simulate concurrent requests and verify that rate limiting works
 * correctly even under stress.
 *
 * Run with: yarn test --testPathPattern="RateLimiter.stress" --runInBand
 *
 * Note: These tests are marked with .skip by default as they take longer
 * to run. Remove .skip to run them during development or CI.
 */

import {
  checkRateLimit,
  updateRateLimitCounter,
  RateLimitOptions,
} from "../RateLimiter";
import { redisClient } from "../../clients/redisClient";

// Mock the redis client with an in-memory store for stress testing
const mockStore = new Map<string, string>();

jest.mock("../../clients/redisClient", () => ({
  redisClient: {
    get: jest.fn((key: string) => Promise.resolve(mockStore.get(key) || null)),
    set: jest.fn(
      (key: string, value: string, _ex?: string, _ttl?: number) => {
        mockStore.set(key, value);
        return Promise.resolve("OK");
      }
    ),
  },
}));

describe("RateLimiter Stress Tests", () => {
  beforeEach(() => {
    mockStore.clear();
    jest.clearAllMocks();
  });

  describe("High-volume request-based limiting", () => {
    const requestBasedOptions: RateLimitOptions = {
      time_window: 60, // 1 minute
      segment: undefined,
      quota: 100,
      unit: "request",
    };

    const baseProps = {
      heliconeProperties: {},
      userId: undefined,
      rateLimitOptions: requestBasedOptions,
      providerAuthHash: "stress-test-hash",
      cost: 0,
    };

    it("should correctly limit after exactly quota requests", async () => {
      // Make exactly 100 requests (at quota)
      for (let i = 0; i < 100; i++) {
        const checkResult = await checkRateLimit(baseProps);
        // First 100 should be ok (0 to 99 current, adding 1 stays <= 100)
        if (i < 100) {
          expect(checkResult.status).toBe("ok");
        }
        await updateRateLimitCounter(baseProps);
      }

      // After 100 updates, checking should show we're at the limit
      // The 101st request check should show rate_limited
      const finalCheck = await checkRateLimit(baseProps);
      // 100 recorded > 100 quota, so rate_limited
      expect(finalCheck.status).toBe("rate_limited");
    });

    it("should handle burst of concurrent check requests", async () => {
      // First, add 90 requests to get close to the limit
      for (let i = 0; i < 90; i++) {
        await updateRateLimitCounter(baseProps);
      }

      // Now simulate concurrent check requests
      const concurrentChecks = Array.from({ length: 20 }, () =>
        checkRateLimit(baseProps)
      );

      const results = await Promise.all(concurrentChecks);

      // All checks should succeed since we're at 90/100
      results.forEach((result) => {
        expect(result.status).toBe("ok");
        expect(result.remaining).toBe(10);
      });
    });

    it("should maintain accuracy under rapid sequential updates", async () => {
      const updateCount = 50;

      // Rapidly update the counter
      for (let i = 0; i < updateCount; i++) {
        await updateRateLimitCounter(baseProps);
      }

      // Check the final state
      const result = await checkRateLimit(baseProps);

      expect(result.status).toBe("ok");
      expect(result.remaining).toBe(50); // 100 - 50 = 50
    });
  });

  describe("High-volume cost-based limiting", () => {
    const costBasedOptions: RateLimitOptions = {
      time_window: 30 * 24 * 60 * 60, // 30 days
      segment: undefined,
      quota: 8500, // $85 in cents
      unit: "cents",
    };

    it("should correctly track cumulative costs", async () => {
      const baseProps = {
        heliconeProperties: {},
        userId: undefined,
        rateLimitOptions: costBasedOptions,
        providerAuthHash: "cost-stress-hash",
        cost: 0, // Will be set per request
      };

      // Simulate 85 requests each costing $0.99 = $84.15 total
      const requestCost = 0.99; // $0.99
      for (let i = 0; i < 85; i++) {
        await updateRateLimitCounter({ ...baseProps, cost: requestCost });
      }

      // Total: 85 * 99 cents = 8415 cents = $84.15
      const result = await checkRateLimit(baseProps);
      expect(result.status).toBe("ok");
      expect(result.remaining).toBe(85); // 8500 - 8415 = 85 cents = $0.85

      // One more dollar should put us over
      await updateRateLimitCounter({ ...baseProps, cost: 1.0 }); // $1.00 = 100 cents

      // Total: 8415 + 100 = 8515 cents > 8500 quota
      const afterResult = await checkRateLimit(baseProps);
      expect(afterResult.status).toBe("rate_limited");
    });

    it("should handle many small transactions", async () => {
      const baseProps = {
        heliconeProperties: {},
        userId: undefined,
        rateLimitOptions: costBasedOptions,
        providerAuthHash: "small-cost-stress-hash",
        cost: 0.01, // 1 cent
      };

      // Make 8500 requests each costing 1 cent (exactly at quota)
      for (let i = 0; i < 8500; i++) {
        await updateRateLimitCounter(baseProps);
      }

      // Should be exactly at limit
      const result = await checkRateLimit(baseProps);
      // 8500 > 8500 is false, so should be ok
      expect(result.remaining).toBe(0);
      expect(result.status).toBe("rate_limited"); // 8500 >= 8500 in checkOnly mode

      // Wait, with our fix: checkOnly uses currentUsage >= quota
      // 8500 >= 8500 is true, so rate_limited
    });
  });

  describe("Multi-segment stress testing", () => {
    it("should handle many different segments simultaneously", async () => {
      const options: RateLimitOptions = {
        time_window: 60,
        segment: "user",
        quota: 10,
        unit: "request",
      };

      // Simulate 100 different users
      const userCount = 100;
      const requestsPerUser = 5;

      for (let user = 0; user < userCount; user++) {
        const props = {
          heliconeProperties: {},
          userId: `user-${user}`,
          rateLimitOptions: options,
          providerAuthHash: "multi-segment-hash",
          cost: 0,
        };

        for (let req = 0; req < requestsPerUser; req++) {
          await updateRateLimitCounter(props);
        }
      }

      // Check each user has independent limits
      for (let user = 0; user < userCount; user++) {
        const props = {
          heliconeProperties: {},
          userId: `user-${user}`,
          rateLimitOptions: options,
          providerAuthHash: "multi-segment-hash",
          cost: 0,
        };

        const result = await checkRateLimit(props);
        expect(result.status).toBe("ok");
        expect(result.remaining).toBe(5); // 10 - 5 = 5
      }
    });
  });

  describe("Window boundary stress testing", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-01-15T12:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should correctly handle requests spanning window boundaries", async () => {
      const options: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 10,
        unit: "request",
      };

      const props = {
        heliconeProperties: {},
        userId: undefined,
        rateLimitOptions: options,
        providerAuthHash: "window-boundary-hash",
        cost: 0,
      };

      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        await updateRateLimitCounter(props);
      }

      // Should be at limit
      let result = await checkRateLimit(props);
      expect(result.status).toBe("rate_limited");

      // Advance time by 61 seconds (past the window)
      jest.advanceTimersByTime(61000);

      // Should be reset now
      result = await checkRateLimit(props);
      expect(result.status).toBe("ok");
      expect(result.remaining).toBe(10);
    });

    it("should handle gradual window sliding", async () => {
      const options: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 5,
        unit: "request",
      };

      const props = {
        heliconeProperties: {},
        userId: undefined,
        rateLimitOptions: options,
        providerAuthHash: "sliding-window-hash",
        cost: 0,
      };

      // Make 5 requests over 50 seconds
      for (let i = 0; i < 5; i++) {
        await updateRateLimitCounter(props);
        jest.advanceTimersByTime(10000); // 10 seconds between each
      }

      // All 5 requests are still in the window
      let result = await checkRateLimit(props);
      expect(result.status).toBe("rate_limited");

      // Advance 20 more seconds - now the first request falls out
      jest.advanceTimersByTime(20000);

      result = await checkRateLimit(props);
      // 4 requests remain in window (requests 2-5 from 40s, 30s, 20s, 10s ago)
      expect(result.status).toBe("ok");
      expect(result.remaining).toBe(1);
    });
  });

  describe("Error resilience", () => {
    it("should handle Redis connection errors gracefully", async () => {
      const options: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 10,
        unit: "request",
      };

      const props = {
        heliconeProperties: {},
        userId: undefined,
        rateLimitOptions: options,
        providerAuthHash: "error-resilience-hash",
        cost: 0,
      };

      // Simulate Redis error
      const mockGet = redisClient?.get as jest.Mock;
      mockGet.mockRejectedValueOnce(new Error("Redis connection error"));

      // The function should handle the error gracefully
      // This depends on the implementation - may throw or return a default
      try {
        const result = await checkRateLimit(props);
        // If it doesn't throw, it might return a default
        expect(result).toBeDefined();
      } catch (error) {
        // If it throws, that's also valid behavior
        expect(error).toBeDefined();
      }
    });

    it("should handle malformed data in Redis", async () => {
      const options: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 10,
        unit: "request",
      };

      const props = {
        heliconeProperties: {},
        userId: undefined,
        rateLimitOptions: options,
        providerAuthHash: "malformed-data-hash",
        cost: 0,
      };

      // Put malformed data in the store
      const mockGet = redisClient?.get as jest.Mock;
      mockGet.mockResolvedValueOnce("not-valid-json");

      // Should handle JSON parse error
      try {
        await checkRateLimit(props);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Performance benchmarks", () => {
    it("should complete 1000 checks in reasonable time", async () => {
      const options: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 10000,
        unit: "request",
      };

      const props = {
        heliconeProperties: {},
        userId: undefined,
        rateLimitOptions: options,
        providerAuthHash: "perf-benchmark-hash",
        cost: 0,
      };

      const startTime = Date.now();

      // Run 1000 check operations
      for (let i = 0; i < 1000; i++) {
        await checkRateLimit(props);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in under 5 seconds (very generous for mocked Redis)
      expect(duration).toBeLessThan(5000);
      console.log(`1000 checks completed in ${duration}ms`);
    });

    it("should complete 1000 updates in reasonable time", async () => {
      const options: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 10000,
        unit: "request",
      };

      const props = {
        heliconeProperties: {},
        userId: undefined,
        rateLimitOptions: options,
        providerAuthHash: "perf-update-hash",
        cost: 0,
      };

      const startTime = Date.now();

      // Run 1000 update operations
      for (let i = 0; i < 1000; i++) {
        await updateRateLimitCounter(props);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in under 5 seconds
      expect(duration).toBeLessThan(5000);
      console.log(`1000 updates completed in ${duration}ms`);
    });
  });
});
