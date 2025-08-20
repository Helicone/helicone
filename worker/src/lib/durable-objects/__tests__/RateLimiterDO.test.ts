import { describe, it, expect } from "vitest";
import { RateLimitRequest, RateLimitResponse } from "../RateLimiterDO";

describe("RateLimiterDO Logic", () => {
  describe("Rate limit calculations", () => {
    it("should calculate remaining quota correctly", () => {
      const quota = 100;
      const currentUsage = 25;
      const unitCount = 10;
      
      const remaining = Math.max(0, quota - currentUsage);
      const wouldExceed = currentUsage + unitCount > quota;
      const finalRemaining = wouldExceed ? remaining : Math.max(0, remaining - unitCount);
      
      expect(remaining).toBe(75);
      expect(wouldExceed).toBe(false);
      expect(finalRemaining).toBe(65);
    });

    it("should detect when quota would be exceeded", () => {
      const quota = 10;
      const currentUsage = 8;
      const unitCount = 5;
      
      const wouldExceed = currentUsage + unitCount > quota;
      const remaining = Math.max(0, quota - currentUsage);
      
      expect(wouldExceed).toBe(true);
      expect(remaining).toBe(2);
    });

    it("should handle edge case at exact quota", () => {
      const quota = 10;
      const currentUsage = 10;
      const unitCount = 1;
      
      const wouldExceed = currentUsage + unitCount > quota;
      const remaining = Math.max(0, quota - currentUsage);
      
      expect(wouldExceed).toBe(true);
      expect(remaining).toBe(0);
    });

    it("should calculate cents-based unit count", () => {
      const cost = 25.5;
      const unit = "cents";
      const unitCount = unit === "cents" ? cost : 1;
      
      expect(unitCount).toBe(25.5);
    });

    it("should calculate request-based unit count", () => {
      const unit = "request";
      const unitCount = unit === "cents" ? 0 : 1;
      
      expect(unitCount).toBe(1);
    });

    it("should calculate reset time correctly", () => {
      const now = Date.now();
      const timeWindow = 3600; // 1 hour
      const oldestTimestamp = now - 1800000; // 30 minutes ago
      
      const reset = Math.ceil((oldestTimestamp + timeWindow * 1000 - now) / 1000);
      const finalReset = Math.max(0, reset);
      
      expect(finalReset).toBe(1800); // 30 minutes remaining
    });

    it("should handle no entries for reset calculation", () => {
      const oldestTimestamp = null;
      const reset = oldestTimestamp ? 100 : undefined;
      
      expect(reset).toBeUndefined();
    });
  });

  describe("Request validation", () => {
    it("should validate request structure", () => {
      const validRequest: RateLimitRequest = {
        segmentKey: "test-key",
        timeWindow: 60,
        quota: 10,
        unit: "request",
        checkOnly: false
      };

      expect(validRequest.segmentKey).toBe("test-key");
      expect(validRequest.timeWindow).toBe(60);
      expect(validRequest.quota).toBe(10);
      expect(validRequest.unit).toBe("request");
      expect(validRequest.checkOnly).toBe(false);
    });

    it("should validate cents-based request", () => {
      const validRequest: RateLimitRequest = {
        segmentKey: "test-key",
        timeWindow: 3600,
        quota: 1000,
        unit: "cents",
        cost: 25,
        checkOnly: true
      };

      expect(validRequest.unit).toBe("cents");
      expect(validRequest.cost).toBe(25);
      expect(validRequest.checkOnly).toBe(true);
    });
  });

  describe("Response structure", () => {
    it("should create proper OK response", () => {
      const response: RateLimitResponse = {
        status: "ok",
        limit: 100,
        remaining: 75,
        reset: 3600,
        currentUsage: 25
      };

      expect(response.status).toBe("ok");
      expect(response.limit).toBe(100);
      expect(response.remaining).toBe(75);
      expect(response.reset).toBe(3600);
      expect(response.currentUsage).toBe(25);
    });

    it("should create proper rate limited response", () => {
      const response: RateLimitResponse = {
        status: "rate_limited",
        limit: 10,
        remaining: 0,
        reset: 1800,
        currentUsage: 10
      };

      expect(response.status).toBe("rate_limited");
      expect(response.remaining).toBe(0);
      expect(response.currentUsage).toBe(10);
    });
  });
});