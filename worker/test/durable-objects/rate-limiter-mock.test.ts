import { describe, it, expect } from "vitest";

// Mock implementation that mimics the DO behavior without dependencies
class MockRateLimiterDO {
  private storage = new Map<string, { usage: number; entries: Array<{ timestamp: number; unitCount: number }> }>();

  async fetch(request: Request): Promise<Response> {
    const body = await request.json();
    const { segmentKey, timeWindow, quota, unit, cost, checkOnly } = body;

    const now = Date.now();
    const windowStartMs = now - timeWindow * 1000;

    // Get or create segment data
    let segmentData = this.storage.get(segmentKey);
    if (!segmentData) {
      segmentData = { usage: 0, entries: [] };
      this.storage.set(segmentKey, segmentData);
    }

    // Clean up old entries
    segmentData.entries = segmentData.entries.filter(entry => entry.timestamp >= windowStartMs);

    // Calculate current usage
    const currentUsage = segmentData.entries.reduce((sum, entry) => sum + entry.unitCount, 0);

    // Calculate unit count
    const unitCount = unit === "cents" ? (cost || 0) : 1;

    // Check if would exceed quota using > not >=
    const wouldExceed = currentUsage + unitCount > quota;

    if (wouldExceed) {
      return Response.json({
        status: "rate_limited",
        limit: quota,
        remaining: Math.max(0, quota - currentUsage),
        currentUsage,
      });
    }

    // If not check-only, update usage
    if (!checkOnly) {
      segmentData.entries.push({ timestamp: now, unitCount });
    }

    const newUsage = checkOnly ? currentUsage : currentUsage + unitCount;
    return Response.json({
      status: "ok",
      limit: quota,
      remaining: Math.max(0, quota - newUsage),
      currentUsage: newUsage,
    });
  }
}

describe("MockRateLimiterDO Tests", () => {
  describe("Request-based rate limiting", () => {
    it("should allow requests within quota", async () => {
      const mockDO = new MockRateLimiterDO();
      
      // First request
      const result1 = await mockDO.fetch(new Request("http://test.com", {
        method: "POST",
        body: JSON.stringify({
          segmentKey: "user=test-user",
          timeWindow: 60,
          quota: 3,
          unit: "request",
          checkOnly: false,
        }),
      }));
      const data1 = await result1.json();

      expect(data1.status).toBe("ok");
      expect(data1.limit).toBe(3);
      expect(data1.remaining).toBe(2);
      expect(data1.currentUsage).toBe(1);

      // Fourth request (should be rate limited)
      const result4 = await mockDO.fetch(new Request("http://test.com", {
        method: "POST",
        body: JSON.stringify({
          segmentKey: "user=test-user",
          timeWindow: 60,
          quota: 3,
          unit: "request",
          checkOnly: false,
        }),
      }));
      await result4.json();

      const result5 = await mockDO.fetch(new Request("http://test.com", {
        method: "POST",
        body: JSON.stringify({
          segmentKey: "user=test-user",
          timeWindow: 60,
          quota: 3,
          unit: "request",
          checkOnly: false,
        }),
      }));
      await result5.json();

      const result6 = await mockDO.fetch(new Request("http://test.com", {
        method: "POST",
        body: JSON.stringify({
          segmentKey: "user=test-user",
          timeWindow: 60,
          quota: 3,
          unit: "request",
          checkOnly: false,
        }),
      }));
      const data6 = await result6.json();

      expect(data6.status).toBe("rate_limited");
      expect(data6.remaining).toBe(0);
      expect(data6.currentUsage).toBe(3);
    });
  });

  describe("Cents-based rate limiting", () => {
    it("should deduct costs from quota correctly", async () => {
      const mockDO = new MockRateLimiterDO();
      
      // First request with 1.5 cents cost
      const result1 = await mockDO.fetch(new Request("http://test.com", {
        method: "POST",
        body: JSON.stringify({
          segmentKey: "user=cents-user",
          timeWindow: 60,
          quota: 10,
          unit: "cents",
          cost: 1.5,
          checkOnly: false,
        }),
      }));
      const data1 = await result1.json();

      expect(data1.status).toBe("ok");
      expect(data1.limit).toBe(10);
      expect(data1.remaining).toBeCloseTo(8.5);
      expect(data1.currentUsage).toBeCloseTo(1.5);

      // Third request that would exceed quota
      const result3 = await mockDO.fetch(new Request("http://test.com", {
        method: "POST",
        body: JSON.stringify({
          segmentKey: "user=cents-user",
          timeWindow: 60,
          quota: 10,
          unit: "cents",
          cost: 9,
          checkOnly: false,
        }),
      }));
      const data3 = await result3.json();

      expect(data3.status).toBe("rate_limited");
      expect(data3.remaining).toBeCloseTo(8.5);
      expect(data3.currentUsage).toBeCloseTo(1.5);
    });

    it("should handle exact quota boundary correctly (> not >=)", async () => {
      const mockDO = new MockRateLimiterDO();
      
      // Request with exact quota amount should be allowed
      const result1 = await mockDO.fetch(new Request("http://test.com", {
        method: "POST",
        body: JSON.stringify({
          segmentKey: "user=boundary-user",
          timeWindow: 60,
          quota: 5,
          unit: "cents",
          cost: 5,
          checkOnly: false,
        }),
      }));
      const data1 = await result1.json();

      expect(data1.status).toBe("ok");
      expect(data1.remaining).toBe(0);
      expect(data1.currentUsage).toBe(5);

      // Next request should be rate limited because 5 + 0.1 > 5
      const result2 = await mockDO.fetch(new Request("http://test.com", {
        method: "POST",
        body: JSON.stringify({
          segmentKey: "user=boundary-user",
          timeWindow: 60,
          quota: 5,
          unit: "cents",
          cost: 0.1,
          checkOnly: false,
        }),
      }));
      const data2 = await result2.json();

      expect(data2.status).toBe("rate_limited");
      expect(data2.currentUsage).toBe(5);
    });
  });

  describe("Check-only mode", () => {
    it("should not update counters in check-only mode", async () => {
      const mockDO = new MockRateLimiterDO();
      
      // Check without updating
      const checkResult = await mockDO.fetch(new Request("http://test.com", {
        method: "POST",
        body: JSON.stringify({
          segmentKey: "user=check-user",
          timeWindow: 60,
          quota: 2,
          unit: "request",
          checkOnly: true,
        }),
      }));
      const checkData = await checkResult.json();

      expect(checkData.status).toBe("ok");
      expect(checkData.remaining).toBe(2);
      expect(checkData.currentUsage).toBe(0);

      // Check again - should still be at 0
      const checkResult2 = await mockDO.fetch(new Request("http://test.com", {
        method: "POST",
        body: JSON.stringify({
          segmentKey: "user=check-user",
          timeWindow: 60,
          quota: 2,
          unit: "request",
          checkOnly: true,
        }),
      }));
      const checkData2 = await checkResult2.json();

      expect(checkData2.remaining).toBe(2);
      expect(checkData2.currentUsage).toBe(0);

      // Now actually increment
      const actualResult = await mockDO.fetch(new Request("http://test.com", {
        method: "POST",
        body: JSON.stringify({
          segmentKey: "user=check-user",
          timeWindow: 60,
          quota: 2,
          unit: "request",
          checkOnly: false,
        }),
      }));
      const actualData = await actualResult.json();

      expect(actualData.remaining).toBe(1);
      expect(actualData.currentUsage).toBe(1);
    });
  });
});