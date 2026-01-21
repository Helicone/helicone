/**
 * Unit tests for Bucket Algorithm
 *
 * Tests the core bucket rate limiting algorithm:
 * - Token consumption
 * - Lazy refill calculations
 * - Policy change handling
 * - Edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Bucket Algorithm", () => {
  /**
   * Pure function implementation of bucket for testing
   * This mirrors the algorithm in BucketRateLimiterDO
   */
  interface BucketState {
    tokens: number;
    lastRefillMs: number;
    capacity: number;
    windowSeconds: number;
  }

  function createBucket(
    capacity: number,
    windowSeconds: number,
    nowMs: number
  ): BucketState {
    return {
      tokens: capacity,
      lastRefillMs: nowMs,
      capacity,
      windowSeconds,
    };
  }

  function refill(state: BucketState, nowMs: number): BucketState {
    const elapsedMs = nowMs - state.lastRefillMs;
    if (elapsedMs <= 0) {
      return state;
    }

    const elapsedSeconds = elapsedMs / 1000;
    const refillRate = state.capacity / state.windowSeconds;
    const tokensToAdd = elapsedSeconds * refillRate;

    return {
      ...state,
      tokens: Math.min(state.capacity, state.tokens + tokensToAdd),
      lastRefillMs: nowMs,
    };
  }

  function consume(
    state: BucketState,
    cost: number,
    nowMs: number
  ): { state: BucketState; allowed: boolean } {
    const refilledState = refill(state, nowMs);
    const allowed = refilledState.tokens >= cost;

    if (allowed) {
      return {
        state: {
          ...refilledState,
          tokens: Math.max(0, refilledState.tokens - cost),
        },
        allowed: true,
      };
    }

    return { state: refilledState, allowed: false };
  }

  describe("bucket initialization", () => {
    it("starts with full capacity", () => {
      const bucket = createBucket(100, 3600, Date.now());

      expect(bucket.tokens).toBe(100);
      expect(bucket.capacity).toBe(100);
    });

    it("handles different capacities", () => {
      const bucket1 = createBucket(10, 60, Date.now());
      const bucket2 = createBucket(10000, 86400, Date.now());

      expect(bucket1.tokens).toBe(10);
      expect(bucket2.tokens).toBe(10000);
    });
  });

  describe("token consumption", () => {
    it("allows request when tokens available", () => {
      const nowMs = Date.now();
      const bucket = createBucket(100, 3600, nowMs);

      const result = consume(bucket, 1, nowMs);

      expect(result.allowed).toBe(true);
      expect(result.state.tokens).toBe(99);
    });

    it("denies request when insufficient tokens", () => {
      const nowMs = Date.now();
      let bucket = createBucket(1, 3600, nowMs);

      // Consume all tokens
      bucket = consume(bucket, 1, nowMs).state;

      // Try to consume more
      const result = consume(bucket, 1, nowMs);

      expect(result.allowed).toBe(false);
      expect(result.state.tokens).toBe(0);
    });

    it("handles fractional token consumption (cents)", () => {
      const nowMs = Date.now();
      const bucket = createBucket(1000, 3600, nowMs);

      const result = consume(bucket, 0.5, nowMs);

      expect(result.allowed).toBe(true);
      expect(result.state.tokens).toBe(999.5);
    });

    it("allows burst up to capacity", () => {
      const nowMs = Date.now();
      let bucket = createBucket(100, 3600, nowMs);

      // Consume all tokens in a burst
      for (let i = 0; i < 100; i++) {
        const result = consume(bucket, 1, nowMs);
        expect(result.allowed).toBe(true);
        bucket = result.state;
      }

      // 101st request should fail
      const result = consume(bucket, 1, nowMs);
      expect(result.allowed).toBe(false);
    });

    it("prevents negative token count", () => {
      const nowMs = Date.now();
      const bucket = createBucket(10, 3600, nowMs);

      // Consume exactly all tokens
      const result = consume(bucket, 10, nowMs);

      expect(result.state.tokens).toBe(0);
      expect(result.state.tokens).toBeGreaterThanOrEqual(0);
    });
  });

  describe("lazy refill", () => {
    it("refills tokens over time", () => {
      const startMs = 1000000;
      let bucket = createBucket(100, 3600, startMs);

      // Consume all tokens
      for (let i = 0; i < 100; i++) {
        bucket = consume(bucket, 1, startMs).state;
      }
      expect(bucket.tokens).toBe(0);

      // Wait 1 hour (3600 seconds) - should fully refill
      const result = consume(bucket, 1, startMs + 3600000);

      expect(result.allowed).toBe(true);
      // Should have refilled to 100, then consumed 1
      expect(result.state.tokens).toBe(99);
    });

    it("refills proportionally to elapsed time", () => {
      const startMs = 1000000;
      let bucket = createBucket(100, 3600, startMs);

      // Consume all tokens
      for (let i = 0; i < 100; i++) {
        bucket = consume(bucket, 1, startMs).state;
      }
      expect(bucket.tokens).toBe(0);

      // Wait 36 seconds (1% of window) - should refill 1 token
      const refilledBucket = refill(bucket, startMs + 36000);

      // 36000ms / 3600000ms * 100 tokens = 1 token
      expect(refilledBucket.tokens).toBeCloseTo(1, 5);
    });

    it("does not exceed capacity on refill", () => {
      const startMs = 1000000;
      const bucket = createBucket(100, 3600, startMs);

      // Wait 2 hours - should still cap at 100
      const refilledBucket = refill(bucket, startMs + 7200000);

      expect(refilledBucket.tokens).toBe(100);
    });

    it("handles refill with no elapsed time", () => {
      const nowMs = 1000000;
      const bucket = createBucket(50, 3600, nowMs);

      const refilledBucket = refill(bucket, nowMs);

      expect(refilledBucket.tokens).toBe(50);
    });

    it("handles refill with negative elapsed time (clock skew)", () => {
      const startMs = 1000000;
      const bucket = createBucket(100, 3600, startMs);

      // Time goes backwards - should not change tokens
      const refilledBucket = refill(bucket, startMs - 1000);

      expect(refilledBucket.tokens).toBe(100);
    });

    it("calculates correct refill rate for different windows", () => {
      const startMs = 1000000;

      // 60 tokens per 60 seconds = 1 token/second
      let bucket1 = createBucket(60, 60, startMs);
      bucket1 = { ...bucket1, tokens: 0 };
      const refilled1 = refill(bucket1, startMs + 1000); // 1 second later
      expect(refilled1.tokens).toBeCloseTo(1, 5);

      // 3600 tokens per 3600 seconds = 1 token/second
      let bucket2 = createBucket(3600, 3600, startMs);
      bucket2 = { ...bucket2, tokens: 0 };
      const refilled2 = refill(bucket2, startMs + 1000);
      expect(refilled2.tokens).toBeCloseTo(1, 5);

      // 100 tokens per 100 seconds = 1 token/second
      let bucket3 = createBucket(100, 100, startMs);
      bucket3 = { ...bucket3, tokens: 0 };
      const refilled3 = refill(bucket3, startMs + 1000);
      expect(refilled3.tokens).toBeCloseTo(1, 5);
    });
  });

  describe("reset time calculation", () => {
    function calculateResetSeconds(
      tokens: number,
      capacity: number,
      windowSeconds: number
    ): number {
      const refillRate = capacity / windowSeconds;
      const tokensNeeded = capacity - tokens;
      if (tokensNeeded <= 0) return 0;
      return Math.ceil(tokensNeeded / refillRate);
    }

    it("returns 0 when bucket is full", () => {
      const resetSeconds = calculateResetSeconds(100, 100, 3600);
      expect(resetSeconds).toBe(0);
    });

    it("calculates time to full refill when empty", () => {
      // 100 tokens / (100/3600 tokens per second) = 3600 seconds
      const resetSeconds = calculateResetSeconds(0, 100, 3600);
      expect(resetSeconds).toBe(3600);
    });

    it("calculates partial refill time", () => {
      // Need 50 tokens, at rate of 100/3600 = 0.0278 tokens/sec
      // Time = 50 / (100/3600) = 1800 seconds
      const resetSeconds = calculateResetSeconds(50, 100, 3600);
      expect(resetSeconds).toBe(1800);
    });

    it("handles fractional tokens", () => {
      const resetSeconds = calculateResetSeconds(99.5, 100, 3600);
      // Need 0.5 tokens, rate = 100/3600 = 0.0278
      // Time = 0.5 / 0.0278 = 18 seconds (rounded up)
      expect(resetSeconds).toBe(18);
    });
  });

  describe("policy changes", () => {
    function handlePolicyChange(
      existingTokens: number,
      newCapacity: number,
      newWindowSeconds: number,
      nowMs: number
    ): BucketState {
      return {
        tokens: Math.min(existingTokens, newCapacity),
        lastRefillMs: nowMs,
        capacity: newCapacity,
        windowSeconds: newWindowSeconds,
      };
    }

    it("clamps tokens when capacity decreases", () => {
      const newBucket = handlePolicyChange(100, 50, 3600, Date.now());

      expect(newBucket.tokens).toBe(50);
      expect(newBucket.capacity).toBe(50);
    });

    it("preserves tokens when capacity increases", () => {
      const newBucket = handlePolicyChange(50, 100, 3600, Date.now());

      expect(newBucket.tokens).toBe(50);
      expect(newBucket.capacity).toBe(100);
    });

    it("updates window on policy change", () => {
      const newBucket = handlePolicyChange(50, 100, 7200, Date.now());

      expect(newBucket.windowSeconds).toBe(7200);
    });
  });

  describe("edge cases", () => {
    it("handles zero cost consumption", () => {
      const nowMs = Date.now();
      const bucket = createBucket(100, 3600, nowMs);

      const result = consume(bucket, 0, nowMs);

      expect(result.allowed).toBe(true);
      expect(result.state.tokens).toBe(100);
    });

    it("handles very large cost", () => {
      const nowMs = Date.now();
      const bucket = createBucket(100, 3600, nowMs);

      const result = consume(bucket, 1000000, nowMs);

      expect(result.allowed).toBe(false);
    });

    it("handles very small window", () => {
      const startMs = 1000000;
      let bucket = createBucket(60, 60, startMs); // 1 token per second

      // Consume all tokens
      for (let i = 0; i < 60; i++) {
        bucket = consume(bucket, 1, startMs).state;
      }

      // Wait 1 second - should refill 1 token
      const result = consume(bucket, 1, startMs + 1000);
      expect(result.allowed).toBe(true);
    });

    it("handles very large window", () => {
      const startMs = 1000000;
      // 365 days in seconds
      const bucket = createBucket(31536000, 31536000, startMs);

      // Consume 1 token
      const result = consume(bucket, 1, startMs);

      expect(result.allowed).toBe(true);
      expect(result.state.tokens).toBe(31536000 - 1);
    });

    it("handles rapid sequential requests", () => {
      const nowMs = Date.now();
      let bucket = createBucket(10, 60, nowMs);

      // 10 rapid requests should succeed
      for (let i = 0; i < 10; i++) {
        const result = consume(bucket, 1, nowMs);
        expect(result.allowed).toBe(true);
        bucket = result.state;
      }

      // 11th should fail
      const result = consume(bucket, 1, nowMs);
      expect(result.allowed).toBe(false);
    });

    it("handles float precision correctly", () => {
      const startMs = 1000000;
      let bucket = createBucket(3, 3, startMs); // 1 token per second

      // Consume all tokens
      for (let i = 0; i < 3; i++) {
        bucket = consume(bucket, 1, startMs).state;
      }

      // Wait exactly 1 second - should have 1 token
      const refilledBucket = refill(bucket, startMs + 1000);

      // Should be very close to 1
      expect(refilledBucket.tokens).toBeGreaterThan(0.99);
      expect(refilledBucket.tokens).toBeLessThanOrEqual(1.01);
    });
  });

  describe("integration scenarios", () => {
    it("handles typical API rate limiting pattern", () => {
      const startMs = 0;
      let bucket = createBucket(100, 3600, startMs); // 100 requests per hour
      let currentMs = startMs;

      // Simulate 50 requests immediately
      for (let i = 0; i < 50; i++) {
        const result = consume(bucket, 1, currentMs);
        expect(result.allowed).toBe(true);
        bucket = result.state;
      }
      expect(bucket.tokens).toBe(50);

      // Wait 30 minutes (refill 50 tokens)
      currentMs += 30 * 60 * 1000;

      // Should now have ~100 tokens again
      const afterWait = refill(bucket, currentMs);
      expect(afterWait.tokens).toBeCloseTo(100, 1);

      // Make 100 more requests
      bucket = afterWait;
      for (let i = 0; i < 100; i++) {
        const result = consume(bucket, 1, currentMs);
        expect(result.allowed).toBe(true);
        bucket = result.state;
      }

      // 101st should fail
      const result = consume(bucket, 1, currentMs);
      expect(result.allowed).toBe(false);
    });

    it("handles cost-based limiting", () => {
      const startMs = 0;
      let bucket = createBucket(1000, 3600, startMs); // $10 (1000 cents) per hour
      let currentMs = startMs;

      // Make requests with varying costs
      const requests = [
        { cost: 5 }, // $0.05
        { cost: 100 }, // $1.00
        { cost: 50 }, // $0.50
        { cost: 845 }, // $8.45 - total now $10
      ];

      for (const req of requests) {
        const result = consume(bucket, req.cost, currentMs);
        expect(result.allowed).toBe(true);
        bucket = result.state;
      }

      // Should be at or near 0
      expect(bucket.tokens).toBe(0);

      // Another request should fail
      const result = consume(bucket, 1, currentMs);
      expect(result.allowed).toBe(false);
    });

    it("handles per-user isolation simulation", () => {
      const startMs = 0;

      // Each user gets their own bucket
      const user1Bucket = createBucket(10, 60, startMs);
      const user2Bucket = createBucket(10, 60, startMs);

      // User1 exhausts their limit
      let bucket1 = user1Bucket;
      for (let i = 0; i < 10; i++) {
        bucket1 = consume(bucket1, 1, startMs).state;
      }

      // User2 should still be able to make requests
      const user2Result = consume(user2Bucket, 1, startMs);
      expect(user2Result.allowed).toBe(true);

      // User1 should be blocked
      const user1Result = consume(bucket1, 1, startMs);
      expect(user1Result.allowed).toBe(false);
    });
  });
});
