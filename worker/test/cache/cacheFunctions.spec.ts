import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { kvKeyFromRequest } from "../../src/lib/util/cache/cacheFunctions";

// Mock the hash function
vi.mock("../../src", () => ({
  hash: vi.fn((input: string) => Promise.resolve(`hashed_${input}`)),
}));

describe("cacheFunctions", () => {
  describe("kvKeyFromRequest", () => {
    let mockRequest: any;

    beforeEach(() => {
      // Create a mock request
      const headers = new Headers({
        "Content-Type": "application/json",
        "Authorization": "Bearer test-key",
      });
      
      mockRequest = {
        url: "https://api.openai.com/v1/chat/completions",
        requestWrapper: {
          unsafeGetText: vi.fn() as Mock<[], Promise<string>>,
          getHeaders: vi.fn(() => headers) as Mock<[], Headers>,
          heliconeHeaders: {
            cacheHeaders: {
              cacheSeed: null,
              cacheEnabled: true,
              cacheBucketMaxSize: null,
              cacheControl: null,
              cacheIgnoreKeys: null as string[] | null,
            },
          },
          headers: headers,
        },
      };
    });

    it("should generate cache key without ignored keys when cacheIgnoreKeys is null", async () => {
      const requestBody = JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello" }],
        request_id: "unique-123",
        timestamp: "2024-01-01T00:00:00Z",
      });
      
      (mockRequest.requestWrapper.unsafeGetText as Mock).mockResolvedValue(requestBody);

      const result = await kvKeyFromRequest(mockRequest, 0, null);

      // The hash should include the full request body
      expect(result).toContain("hashed_");
      expect(mockRequest.requestWrapper.unsafeGetText).toHaveBeenCalled();
      expect(result).toContain(requestBody);
    });

    it("should exclude ignored keys from cache key generation", async () => {
      const requestBody = {
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello" }],
        request_id: "unique-123",
        timestamp: "2024-01-01T00:00:00Z",
      };
      
      (mockRequest.requestWrapper.unsafeGetText as Mock).mockResolvedValue(JSON.stringify(requestBody));
      mockRequest.requestWrapper.heliconeHeaders.cacheHeaders.cacheIgnoreKeys = ["request_id", "timestamp"];

      const result = await kvKeyFromRequest(mockRequest, 0, null);

      // The hash should not include the ignored keys
      const expectedBody = JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello" }],
      });
      
      expect(result).toContain("hashed_");
      expect(result).toContain(expectedBody);
      expect(result).not.toContain("unique-123");
      expect(result).not.toContain("2024-01-01T00:00:00Z");
    });

    it("should handle non-JSON body gracefully", async () => {
      const textBody = "This is plain text, not JSON";
      
      (mockRequest.requestWrapper.unsafeGetText as Mock).mockResolvedValue(textBody);
      mockRequest.requestWrapper.heliconeHeaders.cacheHeaders.cacheIgnoreKeys = ["some_key"];

      const result = await kvKeyFromRequest(mockRequest, 0, null);

      // For non-JSON bodies, the original text should be used
      expect(result).toContain("hashed_");
      expect(result).toContain(textBody);
    });

    it("should handle empty ignoreKeys array", async () => {
      const requestBody = JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello" }],
        request_id: "unique-123",
      });
      
      (mockRequest.requestWrapper.unsafeGetText as Mock).mockResolvedValue(requestBody);
      mockRequest.requestWrapper.heliconeHeaders.cacheHeaders.cacheIgnoreKeys = [];

      const result = await kvKeyFromRequest(mockRequest, 0, null);

      // With empty array, all keys should be included
      expect(result).toContain("hashed_");
      expect(result).toContain(requestBody);
    });

    it("should handle nested objects correctly when ignoring keys", async () => {
      const requestBody = {
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello" }],
        metadata: {
          request_id: "nested-123",
          timestamp: "2024-01-01T00:00:00Z",
        },
        request_id: "top-level-123",
      };
      
      (mockRequest.requestWrapper.unsafeGetText as Mock).mockResolvedValue(JSON.stringify(requestBody));
      mockRequest.requestWrapper.heliconeHeaders.cacheHeaders.cacheIgnoreKeys = ["request_id"];

      const result = await kvKeyFromRequest(mockRequest, 0, null);

      // Only top-level request_id should be removed, nested one should remain
      const expectedBody = JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello" }],
        metadata: {
          request_id: "nested-123",
          timestamp: "2024-01-01T00:00:00Z",
        },
      });
      
      expect(result).toContain("hashed_");
      expect(result).not.toContain("top-level-123");
      // The nested request_id should still be there
      expect(result).toContain("nested-123");
    });

    it("should generate different cache keys for same content with different non-ignored fields", async () => {
      const requestBody1 = JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello" }],
        request_id: "unique-123",
      });

      const requestBody2 = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello" }],
        request_id: "unique-456",
      });
      
      mockRequest.requestWrapper.heliconeHeaders.cacheHeaders.cacheIgnoreKeys = ["request_id"];

      (mockRequest.requestWrapper.unsafeGetText as Mock).mockResolvedValue(requestBody1);
      const result1 = await kvKeyFromRequest(mockRequest, 0, null);

      (mockRequest.requestWrapper.unsafeGetText as Mock).mockResolvedValue(requestBody2);
      const result2 = await kvKeyFromRequest(mockRequest, 0, null);

      // Keys should be different because model is different (not ignored)
      expect(result1).not.toEqual(result2);
    });

    it("should generate same cache keys for same content with different ignored fields", async () => {
      const requestBody1 = JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello" }],
        request_id: "unique-123",
        timestamp: "2024-01-01T00:00:00Z",
      });

      const requestBody2 = JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello" }],
        request_id: "unique-456",
        timestamp: "2024-02-02T00:00:00Z",
      });
      
      mockRequest.requestWrapper.heliconeHeaders.cacheHeaders.cacheIgnoreKeys = ["request_id", "timestamp"];

      (mockRequest.requestWrapper.unsafeGetText as Mock).mockResolvedValue(requestBody1);
      const result1 = await kvKeyFromRequest(mockRequest, 0, null);

      (mockRequest.requestWrapper.unsafeGetText as Mock).mockResolvedValue(requestBody2);
      const result2 = await kvKeyFromRequest(mockRequest, 0, null);

      // Keys should be the same because only ignored fields are different
      expect(result1).toEqual(result2);
    });

    it("should include cache seed in the key when provided", async () => {
      const requestBody = JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello" }],
      });
      
      (mockRequest.requestWrapper.unsafeGetText as Mock).mockResolvedValue(requestBody);

      const resultWithSeed = await kvKeyFromRequest(mockRequest, 0, "test-seed");
      const resultWithoutSeed = await kvKeyFromRequest(mockRequest, 0, null);

      expect(resultWithSeed).toContain("test-seed");
      expect(resultWithoutSeed).not.toContain("test-seed");
      expect(resultWithSeed).not.toEqual(resultWithoutSeed);
    });

    it("should include freeIndex in the key when greater than or equal to 1", async () => {
      const requestBody = JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello" }],
      });
      
      (mockRequest.requestWrapper.unsafeGetText as Mock).mockResolvedValue(requestBody);

      const resultWithIndex0 = await kvKeyFromRequest(mockRequest, 0, null);
      const resultWithIndex1 = await kvKeyFromRequest(mockRequest, 1, null);
      const resultWithIndex5 = await kvKeyFromRequest(mockRequest, 5, null);

      // Index 0 should not be included
      expect(resultWithIndex0).not.toContain("0");
      // Index 1 and 5 should be included
      expect(resultWithIndex1).toContain("1");
      expect(resultWithIndex5).toContain("5");
      // All should be different
      expect(resultWithIndex0).not.toEqual(resultWithIndex1);
      expect(resultWithIndex1).not.toEqual(resultWithIndex5);
    });

    it("should filter out authorization headers with Google auth tokens", async () => {
      const requestBody = JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello" }],
      });
      
      const googleHeaders = new Headers({
        "Content-Type": "application/json",
        "Authorization": "Bearer ya29.google-auth-token",
        "Helicone-Cache-Control": "max-age=3600",
      });
      
      (mockRequest.requestWrapper.unsafeGetText as Mock).mockResolvedValue(requestBody);
      mockRequest.requestWrapper.headers = googleHeaders;
      mockRequest.requestWrapper.getHeaders = vi.fn(() => googleHeaders);

      const result = await kvKeyFromRequest(mockRequest, 0, null);

      // The result should not contain the Google auth token
      expect(result).not.toContain("ya29");
      // Should contain the helicone-cache header
      expect(result).toContain("helicone-cache-control");
    });
  });
});
