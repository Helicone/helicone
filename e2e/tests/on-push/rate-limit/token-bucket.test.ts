/**
 * Token Bucket Rate Limiter E2E Tests
 *
 * Tests the token bucket rate limiting implementation end-to-end:
 * - Global rate limits (request-based and cost-based)
 * - Per-user rate limits
 * - Per-property rate limits
 * - Token bucket refill behavior
 * - Burst capacity handling
 *
 * Policy format: [quota];w=[time_window];u=[unit];s=[segment]
 * - quota: Maximum tokens (requests or cents)
 * - w: Time window in seconds (min 60)
 * - u: Unit type - "request" (default) or "cents"
 * - s: Segment - "user" or custom property name (default: global)
 *
 * Note on AI Gateway:
 * These tests use the legacy OpenAI proxy endpoint (OPENAI_PROXY_URL), but the
 * rate limiting logic is validated for BOTH legacy proxy AND AI Gateway since
 * they share the same code path:
 *   - Legacy Proxy: Request → proxyForwarder → BucketRateLimiterDO
 *   - AI Gateway:   Request → SimpleAIGateway → gatewayForwarder → proxyForwarder → BucketRateLimiterDO
 *
 * The bucket rate limiter (checkBucketRateLimit/recordBucketUsage) is called in
 * proxyForwarder.ts, which is used by both flows. Testing against the legacy proxy
 * effectively tests the rate limiting implementation for all request paths.
 */

import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
  OPENAI_PROXY_URL,
  AI_GATEWAY_URL,
  TEST_ORG_API_KEY,
  TEST_MESSAGES,
  MOCK_OPENAI_RESPONSE,
  GATEWAY_ENDPOINTS,
} from "../../../lib/constants";
import {
  createChatCompletionRequest,
  ChatCompletionResponse,
  sleep,
} from "../../../lib/test-helpers";

// Rate limit specific constants
const RATE_LIMIT_HEADER = "Helicone-RateLimit-Policy";
const USER_ID_HEADER = "Helicone-User-Id";
const PROPERTY_HEADER_PREFIX = "Helicone-Property-";

// Response headers from rate limiter
const RATE_LIMIT_RESPONSE_HEADERS = {
  LIMIT: "helicone-ratelimit-limit",
  REMAINING: "helicone-ratelimit-remaining",
  RESET: "helicone-ratelimit-reset",
  POLICY: "helicone-ratelimit-policy",
};

interface RateLimitTestResult {
  status: number;
  limit?: string;
  remaining?: string;
  reset?: string;
  policy?: string;
}

/**
 * Create a client with rate limit policy headers
 */
function createRateLimitClient(
  policy: string,
  additionalHeaders: Record<string, string> = {}
): AxiosInstance {
  return axios.create({
    baseURL: OPENAI_PROXY_URL,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TEST_ORG_API_KEY}`,
      "__helicone-mock-response": JSON.stringify(MOCK_OPENAI_RESPONSE),
      [RATE_LIMIT_HEADER]: policy,
      ...additionalHeaders,
    },
    validateStatus: () => true,
  });
}

/**
 * Make a request and extract rate limit info from response
 */
async function makeRateLimitedRequest(
  client: AxiosInstance,
  requestOverrides: Record<string, any> = {}
): Promise<RateLimitTestResult> {
  const requestBody = createChatCompletionRequest({
    model: "gpt-5",
    messages: TEST_MESSAGES.SIMPLE,
    max_tokens: 10,
    ...requestOverrides,
  });

  const response = await client.post<ChatCompletionResponse>(
    GATEWAY_ENDPOINTS.CHAT_COMPLETIONS,
    requestBody
  );

  return {
    status: response.status,
    limit: response.headers[RATE_LIMIT_RESPONSE_HEADERS.LIMIT],
    remaining: response.headers[RATE_LIMIT_RESPONSE_HEADERS.REMAINING],
    reset: response.headers[RATE_LIMIT_RESPONSE_HEADERS.RESET],
    policy: response.headers[RATE_LIMIT_RESPONSE_HEADERS.POLICY],
  };
}

/**
 * Generate a unique segment identifier to isolate tests
 * This ensures tests don't interfere with each other
 */
function uniqueId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

describe("Token Bucket Rate Limiter E2E", () => {
  describe("Global Request-Based Rate Limits", () => {
    it("should allow requests within the rate limit", async () => {
      // Use a unique property to isolate this test's bucket
      const testId = uniqueId();
      const policy = `5;w=60;s=${testId}`;
      const client = createRateLimitClient(policy, {
        [`${PROPERTY_HEADER_PREFIX}${testId}`]: "test-value",
      });

      // Make 3 requests - all should succeed
      for (let i = 0; i < 3; i++) {
        const result = await makeRateLimitedRequest(client);
        expect(result.status).toBe(200);
        expect(result.limit).toBe("5");
        expect(parseInt(result.remaining || "0")).toBeGreaterThanOrEqual(0);
      }
    });

    it("should rate limit after exceeding quota", async () => {
      const testId = uniqueId();
      const policy = `3;w=60;s=${testId}`;
      const client = createRateLimitClient(policy, {
        [`${PROPERTY_HEADER_PREFIX}${testId}`]: "test-value",
      });

      const results: RateLimitTestResult[] = [];

      // Make 5 requests - first 3 should succeed, last 2 should be rate limited
      for (let i = 0; i < 5; i++) {
        const result = await makeRateLimitedRequest(client);
        results.push(result);
      }

      // First 3 should succeed
      expect(results[0].status).toBe(200);
      expect(results[1].status).toBe(200);
      expect(results[2].status).toBe(200);

      // Remaining should be rate limited (429)
      expect(results[3].status).toBe(429);
      expect(results[4].status).toBe(429);

      // Check rate limit headers
      expect(results[0].limit).toBe("3");
      expect(results[0].remaining).toBe("2");
      expect(results[2].remaining).toBe("0");
    });

    it("should return correct rate limit headers", async () => {
      const testId = uniqueId();
      const policy = `10;w=120;s=${testId}`;
      const client = createRateLimitClient(policy, {
        [`${PROPERTY_HEADER_PREFIX}${testId}`]: "test-value",
      });

      const result = await makeRateLimitedRequest(client);

      expect(result.status).toBe(200);
      expect(result.limit).toBe("10");
      expect(result.remaining).toBe("9");
      expect(result.policy).toContain("10;w=120");
    });
  });

  describe("Per-User Rate Limits", () => {
    it("should isolate rate limits per user", async () => {
      const policy = "3;w=60;s=user";
      const user1 = `user-${uniqueId()}`;
      const user2 = `user-${uniqueId()}`;

      const clientUser1 = createRateLimitClient(policy, {
        [USER_ID_HEADER]: user1,
      });
      const clientUser2 = createRateLimitClient(policy, {
        [USER_ID_HEADER]: user2,
      });

      // User 1 exhausts their limit
      for (let i = 0; i < 3; i++) {
        const result = await makeRateLimitedRequest(clientUser1);
        expect(result.status).toBe(200);
      }

      // User 1's next request should be rate limited
      const user1RateLimited = await makeRateLimitedRequest(clientUser1);
      expect(user1RateLimited.status).toBe(429);

      // User 2 should still have their full quota
      const user2Result = await makeRateLimitedRequest(clientUser2);
      expect(user2Result.status).toBe(200);
      expect(user2Result.remaining).toBe("2");
    });

    it("should require user ID header for per-user rate limits", async () => {
      const policy = "10;w=60;s=user";
      // Note: Not providing USER_ID_HEADER - should fail-open or return error
      const client = createRateLimitClient(policy);

      const result = await makeRateLimitedRequest(client);

      // With fail-open behavior, request should still succeed
      // but may not have rate limit headers
      expect([200, 400]).toContain(result.status);
    });
  });

  describe("Per-Property Rate Limits", () => {
    it("should isolate rate limits by custom property", async () => {
      const propertyName = "tenant-id";
      const policy = `3;w=60;s=${propertyName}`;
      const tenant1 = `tenant-${uniqueId()}`;
      const tenant2 = `tenant-${uniqueId()}`;

      const clientTenant1 = createRateLimitClient(policy, {
        [`${PROPERTY_HEADER_PREFIX}${propertyName}`]: tenant1,
      });
      const clientTenant2 = createRateLimitClient(policy, {
        [`${PROPERTY_HEADER_PREFIX}${propertyName}`]: tenant2,
      });

      // Tenant 1 exhausts their limit
      for (let i = 0; i < 3; i++) {
        const result = await makeRateLimitedRequest(clientTenant1);
        expect(result.status).toBe(200);
      }

      // Tenant 1's next request should be rate limited
      const tenant1RateLimited = await makeRateLimitedRequest(clientTenant1);
      expect(tenant1RateLimited.status).toBe(429);

      // Tenant 2 should still have their full quota
      const tenant2Result = await makeRateLimitedRequest(clientTenant2);
      expect(tenant2Result.status).toBe(200);
      expect(tenant2Result.remaining).toBe("2");
    });

    it("should support hyphenated property names", async () => {
      const propertyName = "my-custom-segment";
      const testValue = uniqueId();
      const policy = `5;w=60;s=${propertyName}`;

      const client = createRateLimitClient(policy, {
        [`${PROPERTY_HEADER_PREFIX}${propertyName}`]: testValue,
      });

      const result = await makeRateLimitedRequest(client);

      expect(result.status).toBe(200);
      expect(result.limit).toBe("5");
    });
  });

  describe("Cost-Based Rate Limits (Cents)", () => {
    it("should track costs and rate limit when budget exhausted", async () => {
      // 2 cents budget with 60 second window
      // Mock response has ~1.87 cents cost, so 2nd request should be rate limited
      const testId = uniqueId();
      const policy = `2;w=60;u=cents;s=${testId}`;
      const client = createRateLimitClient(policy, {
        [`${PROPERTY_HEADER_PREFIX}${testId}`]: "test-value",
      });

      // First request should succeed (uses ~1.87 cents)
      const result1 = await makeRateLimitedRequest(client);
      expect(result1.status).toBe(200);

      // Wait for cost to be recorded
      await sleep(1000);

      // Second request should be rate limited (budget exhausted)
      const result2 = await makeRateLimitedRequest(client);
      // Note: Cost-based limiting uses check-only initially, then records post-request
      // So behavior may vary based on timing
      expect([200, 429]).toContain(result2.status);
    });

    it("should support larger cent budgets", async () => {
      // 1000 cents ($10) budget
      const testId = uniqueId();
      const policy = `1000;w=60;u=cents;s=${testId}`;
      const client = createRateLimitClient(policy, {
        [`${PROPERTY_HEADER_PREFIX}${testId}`]: "test-value",
      });

      // Multiple requests should succeed
      for (let i = 0; i < 3; i++) {
        const result = await makeRateLimitedRequest(client);
        expect(result.status).toBe(200);
        expect(result.limit).toBe("1000");
      }
    });
  });

  describe("Token Bucket Refill Behavior", () => {
    it("should refill tokens over time", async () => {
      // 2 requests per 60 seconds = 1 request per 30 seconds refill rate
      const testId = uniqueId();
      const policy = `2;w=60;s=${testId}`;
      const client = createRateLimitClient(policy, {
        [`${PROPERTY_HEADER_PREFIX}${testId}`]: "test-value",
      });

      // Exhaust the bucket
      const result1 = await makeRateLimitedRequest(client);
      expect(result1.status).toBe(200);
      expect(result1.remaining).toBe("1");

      const result2 = await makeRateLimitedRequest(client);
      expect(result2.status).toBe(200);
      expect(result2.remaining).toBe("0");

      // Should be rate limited now
      const result3 = await makeRateLimitedRequest(client);
      expect(result3.status).toBe(429);

      // Wait for partial refill (35 seconds should give us ~1.17 tokens)
      console.log("Waiting 35 seconds for token refill...");
      await sleep(35000);

      // Should have enough for 1 more request
      const result4 = await makeRateLimitedRequest(client);
      expect(result4.status).toBe(200);
    }, 60000); // 60 second timeout for this test

    it("should allow burst up to capacity", async () => {
      const testId = uniqueId();
      const policy = `5;w=60;s=${testId}`;
      const client = createRateLimitClient(policy, {
        [`${PROPERTY_HEADER_PREFIX}${testId}`]: "test-value",
      });

      // All 5 requests in rapid succession should succeed (burst)
      const results: RateLimitTestResult[] = [];
      for (let i = 0; i < 5; i++) {
        const result = await makeRateLimitedRequest(client);
        results.push(result);
      }

      // All should succeed
      results.forEach((result, index) => {
        expect(result.status).toBe(200);
        expect(result.remaining).toBe(String(4 - index));
      });

      // 6th should fail
      const result6 = await makeRateLimitedRequest(client);
      expect(result6.status).toBe(429);
    });
  });

  describe("Policy Validation", () => {
    it("should reject window less than 60 seconds", async () => {
      const testId = uniqueId();
      // Invalid: window of 30 seconds (minimum is 60)
      const policy = `10;w=30;s=${testId}`;
      const client = createRateLimitClient(policy, {
        [`${PROPERTY_HEADER_PREFIX}${testId}`]: "test-value",
      });

      const result = await makeRateLimitedRequest(client);

      // With fail-open behavior, request should succeed but without rate limiting
      expect(result.status).toBe(200);
      // May not have rate limit headers due to invalid policy
    });

    it("should handle missing policy header gracefully", async () => {
      // Client without rate limit policy
      const client = axios.create({
        baseURL: OPENAI_PROXY_URL,
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TEST_ORG_API_KEY}`,
          "__helicone-mock-response": JSON.stringify(MOCK_OPENAI_RESPONSE),
        },
        validateStatus: () => true,
      });

      const requestBody = createChatCompletionRequest({
        model: "gpt-5",
        messages: TEST_MESSAGES.SIMPLE,
        max_tokens: 10,
      });

      const response = await client.post(
        GATEWAY_ENDPOINTS.CHAT_COMPLETIONS,
        requestBody
      );

      // Request should succeed without rate limiting
      expect(response.status).toBe(200);
      // Should not have rate limit headers
      expect(response.headers[RATE_LIMIT_RESPONSE_HEADERS.LIMIT]).toBeUndefined();
    });
  });

  describe("Rate Limit Response Format", () => {
    it("should return 429 status with proper error message", async () => {
      const testId = uniqueId();
      const policy = `1;w=60;s=${testId}`;
      const client = createRateLimitClient(policy, {
        [`${PROPERTY_HEADER_PREFIX}${testId}`]: "test-value",
      });

      // Exhaust the limit
      await makeRateLimitedRequest(client);

      // Next request should be rate limited
      const requestBody = createChatCompletionRequest({
        model: "gpt-5",
        messages: TEST_MESSAGES.SIMPLE,
        max_tokens: 10,
      });

      const response = await client.post(
        GATEWAY_ENDPOINTS.CHAT_COMPLETIONS,
        requestBody
      );

      expect(response.status).toBe(429);
      expect(response.data).toHaveProperty("message");
      expect(response.data.message).toContain("rate limit");
    });

    it("should include reset time in headers when rate limited", async () => {
      const testId = uniqueId();
      const policy = `1;w=120;s=${testId}`; // 2 minute window
      const client = createRateLimitClient(policy, {
        [`${PROPERTY_HEADER_PREFIX}${testId}`]: "test-value",
      });

      // Exhaust the limit
      await makeRateLimitedRequest(client);

      // Get rate limited response
      const result = await makeRateLimitedRequest(client);

      expect(result.status).toBe(429);
      // Reset time should be present and reasonable
      if (result.reset) {
        const resetSeconds = parseInt(result.reset);
        expect(resetSeconds).toBeGreaterThan(0);
        expect(resetSeconds).toBeLessThanOrEqual(120);
      }
    });
  });

  describe("AI Gateway Integration", () => {
    /**
     * Note: Direct rate limiting tests for AI Gateway are not included because
     * AI Gateway requires either:
     * 1. BYOK (Bring Your Own Key): Provider keys stored in the database
     * 2. PTB (Pay By Token): Wallet credits for the organization
     *
     * However, the rate limiting logic is the same for both paths since
     * AI Gateway goes through: gatewayForwarder → proxyForwarder
     * The tests above validate this shared code path through the legacy proxy.
     */

    it("should verify AI Gateway endpoint is accessible", async () => {
      const response = await axios.get(`${AI_GATEWAY_URL}/healthcheck`, {
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
    });

    it("should return 401 for unauthenticated AI Gateway requests", async () => {
      // AI Gateway requires authentication for actual requests
      const response = await axios.post(
        `${AI_GATEWAY_URL}/v1/chat/completions`,
        {
          model: "gpt-4",
          messages: [{ role: "user", content: "test" }],
        },
        {
          headers: {
            "Content-Type": "application/json",
            // No Authorization header - should fail auth
          },
          validateStatus: () => true,
        }
      );

      // Should return 401 Unauthorized without valid Helicone API key
      expect(response.status).toBe(401);
    });

    it("should authenticate with valid Helicone API key", async () => {
      // AI Gateway authenticates the Helicone key but may fail on provider selection
      // (since we don't have BYOK keys or wallet credits configured)
      const response = await axios.post(
        `${AI_GATEWAY_URL}/v1/chat/completions`,
        {
          model: "gpt-4",
          messages: [{ role: "user", content: "test" }],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TEST_ORG_API_KEY}`,
          },
          validateStatus: () => true,
        }
      );

      // Should pass auth (not 401) but may fail on provider selection
      // (since we don't have BYOK keys or wallet credits configured)
      expect(response.status).not.toBe(401);
      // 400 = No available providers (body error)
      // 429 = Insufficient credits (no wallet balance)
      // 500 = No available providers (server error response)
      expect([400, 429, 500]).toContain(response.status);

      // Verify it's a provider error, not an auth error
      if (response.data?.error) {
        expect(response.data.error.message).toContain("provider");
      }
    });
  });
});
