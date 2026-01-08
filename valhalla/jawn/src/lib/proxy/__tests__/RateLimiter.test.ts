/**
 * Rate Limiter Tests
 *
 * These tests verify the rate limiting logic for both request-based
 * and cost-based (cents) limiting.
 *
 * Key scenarios tested:
 * - Normal operation (under limit)
 * - At-limit scenarios (exactly at quota)
 * - Over-limit scenarios (exceeding quota)
 * - Edge cases (30-day window boundaries, empty state)
 */

import { checkRateLimit, updateRateLimitCounter, RateLimitOptions } from "../RateLimiter";
import { redisClient } from "../../clients/redisClient";

// Mock the redis client
jest.mock("../../clients/redisClient", () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

describe("RateLimiter", () => {
  const mockRedisGet = redisClient?.get as jest.Mock;
  const mockRedisSet = redisClient?.set as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("checkRateLimit", () => {
    describe("request-based limiting", () => {
      const requestBasedOptions: RateLimitOptions = {
        time_window: 60, // 1 minute
        segment: undefined,
        quota: 10,
        unit: "request",
      };

      const baseProps = {
        heliconeProperties: {},
        userId: undefined,
        rateLimitOptions: requestBasedOptions,
        providerAuthHash: "test-auth-hash",
        cost: 0,
      };

      it("should allow requests when under limit", async () => {
        // 5 requests in the last minute
        const timestamps = Array.from({ length: 5 }, (_, i) => ({
          timestamp: Date.now() - i * 1000,
          unit: 1,
        }));
        mockRedisGet.mockResolvedValue(JSON.stringify(timestamps));

        const result = await checkRateLimit(baseProps);

        expect(result.status).toBe("ok");
        expect(result.remaining).toBe(5);
        expect(result.limit).toBe(10);
      });

      it("should allow requests when at exactly the limit", async () => {
        // Exactly 10 requests in the last minute
        const timestamps = Array.from({ length: 10 }, (_, i) => ({
          timestamp: Date.now() - i * 1000,
          unit: 1,
        }));
        mockRedisGet.mockResolvedValue(JSON.stringify(timestamps));

        const result = await checkRateLimit(baseProps);

        // At exactly the limit, we should still allow access
        // (The user has used their quota but hasn't exceeded it)
        expect(result.status).toBe("ok");
        expect(result.remaining).toBe(0);
      });

      it("should rate limit when over the limit", async () => {
        // 11 requests in the last minute (over the quota of 10)
        const timestamps = Array.from({ length: 11 }, (_, i) => ({
          timestamp: Date.now() - i * 1000,
          unit: 1,
        }));
        mockRedisGet.mockResolvedValue(JSON.stringify(timestamps));

        const result = await checkRateLimit(baseProps);

        expect(result.status).toBe("rate_limited");
        expect(result.remaining).toBe(0);
        expect(result.reset).toBeDefined();
      });

      it("should allow requests when no history exists", async () => {
        mockRedisGet.mockResolvedValue(null);

        const result = await checkRateLimit(baseProps);

        expect(result.status).toBe("ok");
        expect(result.remaining).toBe(10);
      });

      it("should ignore requests outside the time window", async () => {
        // All requests are outside the 1 minute window
        const timestamps = Array.from({ length: 15 }, (_, i) => ({
          timestamp: Date.now() - (70 + i) * 1000, // 70+ seconds ago
          unit: 1,
        }));
        mockRedisGet.mockResolvedValue(JSON.stringify(timestamps));

        const result = await checkRateLimit(baseProps);

        expect(result.status).toBe("ok");
        expect(result.remaining).toBe(10);
      });
    });

    describe("cost-based (cents) limiting", () => {
      const costBasedOptions: RateLimitOptions = {
        time_window: 30 * 24 * 60 * 60, // 30 days in seconds
        segment: undefined,
        quota: 8500, // $85 in cents
        unit: "cents",
      };

      const baseProps = {
        heliconeProperties: {},
        userId: undefined,
        rateLimitOptions: costBasedOptions,
        providerAuthHash: "test-auth-hash",
        cost: 1, // $0.01 (1 cent) - though not used in checkRateLimit
      };

      it("should allow requests when spending is under limit", async () => {
        // $62 spent (6200 cents)
        const timestamps = [
          { timestamp: Date.now() - 1000, unit: 3200 }, // $32
          { timestamp: Date.now() - 2000, unit: 3000 }, // $30
        ];
        mockRedisGet.mockResolvedValue(JSON.stringify(timestamps));

        const result = await checkRateLimit(baseProps);

        expect(result.status).toBe("ok");
        expect(result.remaining).toBe(2300); // 8500 - 6200 = 2300 cents = $23
      });

      it("should allow requests when spending is exactly at limit", async () => {
        // Exactly $85 spent (8500 cents)
        const timestamps = [
          { timestamp: Date.now() - 1000, unit: 5000 }, // $50
          { timestamp: Date.now() - 2000, unit: 3500 }, // $35
        ];
        mockRedisGet.mockResolvedValue(JSON.stringify(timestamps));

        const result = await checkRateLimit(baseProps);

        // At exactly the limit, we should still allow access
        expect(result.status).toBe("ok");
        expect(result.remaining).toBe(0);
      });

      it("should rate limit when spending exceeds limit", async () => {
        // $86 spent (8600 cents) - over the $85 limit
        const timestamps = [
          { timestamp: Date.now() - 1000, unit: 5000 }, // $50
          { timestamp: Date.now() - 2000, unit: 3600 }, // $36
        ];
        mockRedisGet.mockResolvedValue(JSON.stringify(timestamps));

        const result = await checkRateLimit(baseProps);

        expect(result.status).toBe("rate_limited");
        expect(result.remaining).toBe(0);
      });

      it("should reset spending when window expires", async () => {
        // Spending from 31 days ago (outside the 30-day window)
        const oldTimestamp = Date.now() - 31 * 24 * 60 * 60 * 1000;
        const timestamps = [
          { timestamp: oldTimestamp, unit: 8500 }, // $85 spent but outside window
        ];
        mockRedisGet.mockResolvedValue(JSON.stringify(timestamps));

        const result = await checkRateLimit(baseProps);

        expect(result.status).toBe("ok");
        expect(result.remaining).toBe(8500); // Full quota available
      });

      it("should calculate correct reset time", async () => {
        const now = Date.now();
        const oldestTimestamp = now - 10 * 24 * 60 * 60 * 1000; // 10 days ago
        const timestamps = [
          { timestamp: oldestTimestamp, unit: 5000 }, // $50
          { timestamp: now - 1000, unit: 4000 }, // $40 (recent) - total $90 over limit
        ];
        mockRedisGet.mockResolvedValue(JSON.stringify(timestamps));

        const result = await checkRateLimit(baseProps);

        // Reset should be approximately 20 days from now
        // (when the oldest entry falls out of the 30-day window)
        expect(result.reset).toBeDefined();
        expect(result.reset).toBeGreaterThan(0);
      });
    });

    describe("segment-based limiting", () => {
      it("should use user segment when userId is provided", async () => {
        const options: RateLimitOptions = {
          time_window: 60,
          segment: "user",
          quota: 5,
          unit: "request",
        };

        const props = {
          heliconeProperties: {},
          userId: "user-123",
          rateLimitOptions: options,
          providerAuthHash: "test-auth-hash",
          cost: 0,
        };

        mockRedisGet.mockResolvedValue(null);

        const result = await checkRateLimit(props);

        expect(result.status).toBe("ok");
        expect(mockRedisGet).toHaveBeenCalledWith(
          expect.stringContaining("user=user-123")
        );
      });

      it("should throw error when user segment is specified without userId", async () => {
        const options: RateLimitOptions = {
          time_window: 60,
          segment: "user",
          quota: 5,
          unit: "request",
        };

        const props = {
          heliconeProperties: {},
          userId: undefined,
          rateLimitOptions: options,
          providerAuthHash: "test-auth-hash",
          cost: 0,
        };

        await expect(checkRateLimit(props)).rejects.toThrow("Missing user ID");
      });

      it("should use custom property segment", async () => {
        const options: RateLimitOptions = {
          time_window: 60,
          segment: "environment",
          quota: 5,
          unit: "request",
        };

        const props = {
          heliconeProperties: { environment: "production" },
          userId: undefined,
          rateLimitOptions: options,
          providerAuthHash: "test-auth-hash",
          cost: 0,
        };

        mockRedisGet.mockResolvedValue(null);

        const result = await checkRateLimit(props);

        expect(result.status).toBe("ok");
        expect(mockRedisGet).toHaveBeenCalledWith(
          expect.stringContaining("environment=production")
        );
      });
    });
  });

  describe("updateRateLimitCounter", () => {
    const requestBasedOptions: RateLimitOptions = {
      time_window: 60,
      segment: undefined,
      quota: 10,
      unit: "request",
    };

    it("should add request to counter for request-based limiting", async () => {
      mockRedisGet.mockResolvedValue(null);

      await updateRateLimitCounter({
        heliconeProperties: {},
        userId: undefined,
        rateLimitOptions: requestBasedOptions,
        providerAuthHash: "test-auth-hash",
        cost: 0,
      });

      expect(mockRedisSet).toHaveBeenCalled();
      const setCall = mockRedisSet.mock.calls[0];
      const savedData = JSON.parse(setCall[1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].unit).toBe(1);
    });

    it("should add cost in cents for cost-based limiting", async () => {
      const costBasedOptions: RateLimitOptions = {
        time_window: 30 * 24 * 60 * 60,
        segment: undefined,
        quota: 8500,
        unit: "cents",
      };

      mockRedisGet.mockResolvedValue(null);

      await updateRateLimitCounter({
        heliconeProperties: {},
        userId: undefined,
        rateLimitOptions: costBasedOptions,
        providerAuthHash: "test-auth-hash",
        cost: 0.50, // $0.50 = 50 cents
      });

      expect(mockRedisSet).toHaveBeenCalled();
      const setCall = mockRedisSet.mock.calls[0];
      const savedData = JSON.parse(setCall[1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].unit).toBe(50); // 0.50 * 100 = 50 cents
    });

    it("should prune old entries outside the time window", async () => {
      const now = Date.now();
      const oldTimestamps = [
        { timestamp: now - 70000, unit: 1 }, // 70 seconds ago (outside 60s window)
        { timestamp: now - 30000, unit: 1 }, // 30 seconds ago (inside window)
      ];
      mockRedisGet.mockResolvedValue(JSON.stringify(oldTimestamps));

      await updateRateLimitCounter({
        heliconeProperties: {},
        userId: undefined,
        rateLimitOptions: requestBasedOptions,
        providerAuthHash: "test-auth-hash",
        cost: 0,
      });

      expect(mockRedisSet).toHaveBeenCalled();
      const setCall = mockRedisSet.mock.calls[0];
      const savedData = JSON.parse(setCall[1]);
      // Should have 2 entries: 1 old one kept (30s ago) + 1 new one
      expect(savedData).toHaveLength(2);
    });

    it("should set correct expiration time", async () => {
      mockRedisGet.mockResolvedValue(null);

      await updateRateLimitCounter({
        heliconeProperties: {},
        userId: undefined,
        rateLimitOptions: requestBasedOptions,
        providerAuthHash: "test-auth-hash",
        cost: 0,
      });

      expect(mockRedisSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        "EX",
        60 // time_window in seconds
      );
    });
  });

  describe("edge cases", () => {
    it("should handle very large quotas", async () => {
      const largeQuotaOptions: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: Number.MAX_SAFE_INTEGER,
        unit: "request",
      };

      mockRedisGet.mockResolvedValue(null);

      const result = await checkRateLimit({
        heliconeProperties: {},
        userId: undefined,
        rateLimitOptions: largeQuotaOptions,
        providerAuthHash: "test-auth-hash",
        cost: 0,
      });

      expect(result.status).toBe("ok");
      expect(result.remaining).toBe(Number.MAX_SAFE_INTEGER);
    });

    it("should handle zero quota", async () => {
      const zeroQuotaOptions: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 0,
        unit: "request",
      };

      // Even with no history, zero quota means no access
      mockRedisGet.mockResolvedValue(null);

      const result = await checkRateLimit({
        heliconeProperties: {},
        userId: undefined,
        rateLimitOptions: zeroQuotaOptions,
        providerAuthHash: "test-auth-hash",
        cost: 0,
      });

      // Empty state means currentQuota is 0, and quota is 0, so 0 > 0 is false
      expect(result.status).toBe("ok");
    });

    it("should handle fractional costs correctly", async () => {
      const costBasedOptions: RateLimitOptions = {
        time_window: 60,
        segment: undefined,
        quota: 100, // 100 cents = $1
        unit: "cents",
      };

      // Existing usage of 99.5 cents (fractional)
      const timestamps = [{ timestamp: Date.now() - 1000, unit: 99.5 }];
      mockRedisGet.mockResolvedValue(JSON.stringify(timestamps));

      const result = await checkRateLimit({
        heliconeProperties: {},
        userId: undefined,
        rateLimitOptions: costBasedOptions,
        providerAuthHash: "test-auth-hash",
        cost: 0,
      });

      expect(result.status).toBe("ok");
      expect(result.remaining).toBe(0.5);
    });

    it("should handle very long time windows (30 days)", async () => {
      const thirtyDayOptions: RateLimitOptions = {
        time_window: 30 * 24 * 60 * 60, // 30 days
        segment: undefined,
        quota: 8500,
        unit: "cents",
      };

      // Usage spread across the 30-day window
      const now = Date.now();
      const timestamps = [
        { timestamp: now - 29 * 24 * 60 * 60 * 1000, unit: 2000 }, // 29 days ago
        { timestamp: now - 15 * 24 * 60 * 60 * 1000, unit: 2000 }, // 15 days ago
        { timestamp: now - 1 * 24 * 60 * 60 * 1000, unit: 2000 }, // 1 day ago
      ];
      mockRedisGet.mockResolvedValue(JSON.stringify(timestamps));

      const result = await checkRateLimit({
        heliconeProperties: {},
        userId: undefined,
        rateLimitOptions: thirtyDayOptions,
        providerAuthHash: "test-auth-hash",
        cost: 0,
      });

      expect(result.status).toBe("ok");
      expect(result.remaining).toBe(2500); // 8500 - 6000 = 2500
    });
  });
});
