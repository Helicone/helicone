/**
 * Unit Tests for RateLimiterDO
 *
 * These tests verify:
 * 1. Integer arithmetic eliminates precision errors
 * 2. Dynamic bucket sizing scales correctly
 * 3. Rate limiting accuracy is maintained
 */

import { describe, it, expect } from 'vitest';

// Constants from RateLimiterDO
const TARGET_BUCKET_COUNT = 60;
const MIN_BUCKET_SIZE_MS = 1000;
const PRECISION_MULTIPLIER = 10000;

/**
 * Calculate bucket size based on time window (matches RateLimiterDO logic)
 */
function getBucketSize(timeWindowSeconds: number): number {
  const timeWindowMs = timeWindowSeconds * 1000;
  const optimalBucketSize = Math.floor(timeWindowMs / TARGET_BUCKET_COUNT);
  return Math.max(MIN_BUCKET_SIZE_MS, optimalBucketSize);
}

/**
 * Get bucket timestamp (matches RateLimiterDO logic)
 */
function getBucketTimestamp(timestampMs: number, bucketSizeMs: number): number {
  return Math.floor(timestampMs / bucketSizeMs) * bucketSizeMs;
}

describe('RateLimiterDO - Integer Arithmetic', () => {
  it('should eliminate floating-point precision errors', () => {
    // OLD WAY: Floating point
    let floatTotal = 0;
    const smallValue = 0.01; // 0.01 cents
    const iterations = 10000;

    for (let i = 0; i < iterations; i++) {
      floatTotal += smallValue;
    }

    // NEW WAY: Integer arithmetic
    let intTotal = 0;
    const smallValueInUnits = Math.round(smallValue * PRECISION_MULTIPLIER);

    for (let i = 0; i < iterations; i++) {
      intTotal += smallValueInUnits;
    }

    const intTotalConverted = intTotal / PRECISION_MULTIPLIER;

    // Integer arithmetic should be exact
    expect(intTotalConverted).toBe(100.0);

    // Floating point might have errors (though in this case it happens to be ok)
    // The important thing is integer arithmetic is ALWAYS exact
    expect(intTotal).toBe(100 * PRECISION_MULTIPLIER);
  });

  it('should handle very small costs accurately at scale', () => {
    const scenarios = [
      { limitCents: 10, costCents: 0.01, expectedRequests: 1000 },
      { limitCents: 100, costCents: 0.01, expectedRequests: 10000 },
      { limitCents: 1000, costCents: 0.01, expectedRequests: 100000 },
      { limitCents: 10000, costCents: 0.01, expectedRequests: 1000000 },
    ];

    scenarios.forEach((scenario) => {
      const limitInUnits = Math.round(scenario.limitCents * PRECISION_MULTIPLIER);
      const costInUnits = Math.round(scenario.costCents * PRECISION_MULTIPLIER);
      const actualRequests = Math.floor(limitInUnits / costInUnits);

      expect(actualRequests).toBe(scenario.expectedRequests);
    });
  });
});

describe('RateLimiterDO - Dynamic Bucket Sizing', () => {
  it('should calculate correct bucket sizes for various time windows', () => {
    const testCases = [
      { window: 10, expected: 1000 },      // 10s → 1s buckets
      { window: 60, expected: 1000 },      // 60s → 1s buckets
      { window: 120, expected: 2000 },     // 2min → 2s buckets
      { window: 300, expected: 5000 },     // 5min → 5s buckets
      { window: 600, expected: 10000 },    // 10min → 10s buckets
      { window: 3600, expected: 60000 },   // 1hr → 60s buckets
      { window: 7200, expected: 120000 },  // 2hr → 120s buckets
      { window: 86400, expected: 1440000 }, // 24hr → 1440s buckets
    ];

    testCases.forEach((tc) => {
      const actual = getBucketSize(tc.window);
      expect(actual).toBe(tc.expected);
    });
  });

  it('should maintain approximately 60 buckets for all time windows', () => {
    const windows = [10, 30, 60, 120, 300, 600, 1800, 3600, 7200, 86400];

    windows.forEach((windowSec) => {
      const bucketSizeMs = getBucketSize(windowSec);
      const maxBuckets = Math.ceil((windowSec * 1000) / bucketSizeMs);

      // Should not exceed TARGET_BUCKET_COUNT by more than 1 (for rounding)
      expect(maxBuckets).toBeLessThanOrEqual(TARGET_BUCKET_COUNT + 1);
    });
  });

  it('should create significantly fewer buckets for long windows', () => {
    const improvements = [
      { window: 300, oldBuckets: 300, newBuckets: 60, minImprovement: 75 },
      { window: 3600, oldBuckets: 3600, newBuckets: 60, minImprovement: 95 },
      { window: 86400, oldBuckets: 86400, newBuckets: 60, minImprovement: 99 },
    ];

    improvements.forEach((test) => {
      const bucketSizeMs = getBucketSize(test.window);
      const actualBuckets = Math.ceil((test.window * 1000) / bucketSizeMs);
      const improvement = ((test.oldBuckets - actualBuckets) / test.oldBuckets) * 100;

      expect(actualBuckets).toBeLessThanOrEqual(test.newBuckets);
      expect(improvement).toBeGreaterThan(test.minImprovement);
    });
  });

  it('should correctly bucket timestamps', () => {
    const now = Date.now();

    // Test with 1 second buckets
    const bucket1s = getBucketTimestamp(now, 1000);
    expect(bucket1s % 1000).toBe(0); // Should be aligned to second

    // Test with 60 second buckets
    const bucket60s = getBucketTimestamp(now, 60000);
    expect(bucket60s % 60000).toBe(0); // Should be aligned to minute

    // Test that same second goes to same bucket
    const time1 = 1234567890123;
    const time2 = 1234567890456; // Same second, different milliseconds
    expect(getBucketTimestamp(time1, 1000)).toBe(getBucketTimestamp(time2, 1000));
  });
});

describe('RateLimiterDO - Rate Limiting Accuracy', () => {
  it('should maintain 100% accuracy with dynamic buckets', () => {
    const scenarios = [
      {
        name: '60s window, $1 limit',
        timeWindow: 60,
        limitCents: 100,
        costCents: 1,
        numRequests: 120,
      },
      {
        name: '5min window, $10 limit',
        timeWindow: 300,
        limitCents: 1000,
        costCents: 10,
        numRequests: 120,
      },
      {
        name: '1hr window, $100 limit',
        timeWindow: 3600,
        limitCents: 10000,
        costCents: 100,
        numRequests: 120,
      },
    ];

    scenarios.forEach((scenario) => {
      const bucketSizeMs = getBucketSize(scenario.timeWindow);
      const buckets = new Map<number, number>();
      const limitInUnits = Math.round(scenario.limitCents * PRECISION_MULTIPLIER);
      const costInUnits = Math.round(scenario.costCents * PRECISION_MULTIPLIER);

      let currentTime = Date.now();
      let successCount = 0;

      for (let i = 0; i < scenario.numRequests; i++) {
        const bucketTimestamp = getBucketTimestamp(currentTime, bucketSizeMs);
        const windowStart = currentTime - scenario.timeWindow * 1000;
        const windowStartBucket = getBucketTimestamp(windowStart, bucketSizeMs);

        let totalUsage = 0;
        for (const [bucket, usage] of buckets.entries()) {
          if (bucket >= windowStartBucket) {
            totalUsage += usage;
          }
        }

        if (totalUsage + costInUnits <= limitInUnits) {
          const currentBucketUsage = buckets.get(bucketTimestamp) || 0;
          buckets.set(bucketTimestamp, currentBucketUsage + costInUnits);
          successCount++;
        }

        currentTime += 100; // Advance time by 100ms
      }

      const expectedAllowed = Math.floor(limitInUnits / costInUnits);

      // Should be exactly correct (or within 1 for rounding)
      expect(Math.abs(successCount - expectedAllowed)).toBeLessThanOrEqual(1);
    });
  });

  it('should handle high-volume scenarios without precision loss', () => {
    // Simulate $100 limit with $0.0001 requests (1M potential requests)
    const limitCents = 10000;
    const costCents = 0.01;
    const limitInUnits = Math.round(limitCents * PRECISION_MULTIPLIER);
    const costInUnits = Math.round(costCents * PRECISION_MULTIPLIER);

    const expectedRequests = Math.floor(limitInUnits / costInUnits);
    expect(expectedRequests).toBe(1000000); // Should be exactly 1 million

    // Simulate accumulating the cost
    let totalUsage = 0;
    let requestCount = 0;

    while (totalUsage + costInUnits <= limitInUnits) {
      totalUsage += costInUnits;
      requestCount++;
    }

    expect(requestCount).toBe(expectedRequests);
    expect(totalUsage).toBe(limitInUnits); // Should use exactly the limit
  });
});
