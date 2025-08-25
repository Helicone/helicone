import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies - must be hoisted before imports
vi.mock("../../src", () => ({
  hash: vi.fn((input: string) => Promise.resolve(`hashed_${Buffer.from(input).toString('base64').substring(0, 20)}`)),
}));

vi.mock("../../src/lib/safePut", () => ({
  safePut: vi.fn(),
}));

import { kvKeyFromRequest, saveToCache, getCachedResponse } from "../../src/lib/util/cache/cacheFunctions";
import { safePut } from "../../src/lib/safePut";

describe("Simple Cache Test", () => {
  let mockRequest: any;
  let mockCacheKv: any;
  let cacheStorage: Map<string, any>;

  beforeEach(() => {
    // Reset cache storage
    cacheStorage = new Map();
    
    // Create mock KVNamespace
    mockCacheKv = {
      get: vi.fn(async (key: string) => {
        return cacheStorage.get(key) || null;
      }),
      put: vi.fn(async (key: string, value: string, options?: any) => {
        cacheStorage.set(key, JSON.parse(value));
        return Promise.resolve();
      }),
    };

    // Create a mock request
    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": "Bearer test-key",
    });
    
    mockRequest = {
      url: "https://api.openai.com/v1/chat/completions",
      requestWrapper: {
        getText: vi.fn().mockResolvedValue(JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: "What is 2+2?" }],
        })),
        getHeaders: vi.fn(() => headers),
        heliconeHeaders: {
          cacheHeaders: {
            cacheSeed: null,
            cacheEnabled: true,
            cacheBucketMaxSize: null,
            cacheControl: null,
            cacheIgnoreKeys: null,
          },
        },
      },
    };

    // Update safePut mock to actually store in our mock cache
    vi.mocked(safePut).mockImplementation(async ({ keyName, value }: any) => {
      cacheStorage.set(keyName, JSON.parse(value));
      return { success: true };
    });
  });

  it("should cache and retrieve a simple response", async () => {
    // Step 1: Generate cache key
    const cacheKey = await kvKeyFromRequest(mockRequest, 0, null);
    expect(cacheKey).toBeDefined();
    expect(cacheKey).toContain("hashed_");
    
    // Step 2: Check cache is initially empty
    const initialCache = await getCachedResponse(
      mockRequest,
      { bucketSize: 1 },
      mockCacheKv,
      null
    );
    expect(initialCache).toBeNull();
    
    // Step 3: Save response to cache
    const mockResponse = new Response(JSON.stringify({ answer: "4" }), {
      headers: new Headers({
        "Content-Type": "application/json",
        "X-Custom-Header": "test-value",
      }),
    });
    
    const saveResult = await saveToCache({
      request: mockRequest,
      response: mockResponse,
      responseBody: ['{"answer":"4"}'],
      responseLatencyMs: 123,
      cacheControl: "max-age=3600",
      settings: { bucketSize: 1 },
      cacheKv: mockCacheKv,
      cacheSeed: null,
    });
    
    expect(saveResult).toBe(true);
    
    // Step 4: Retrieve from cache
    const cachedResponse = await getCachedResponse(
      mockRequest,
      { bucketSize: 1 },
      mockCacheKv,
      null
    );
    
    expect(cachedResponse).not.toBeNull();
    expect(cachedResponse?.headers.get("Helicone-Cache")).toBe("HIT");
    expect(cachedResponse?.headers.get("Helicone-Cache-Bucket-Idx")).toBe("0");
    expect(cachedResponse?.headers.get("Helicone-Cache-Latency")).toBe("123");
    
    // Step 5: Verify response body
    const body = await cachedResponse?.text();
    expect(body).toBe('{"answer":"4"}');
  });

  it("should return different cached responses for different requests", async () => {
    // Request 1
    const request1Body = JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: "What is 2+2?" }],
    });
    
    // Manually populate cache for request 1
    vi.mocked(mockRequest.requestWrapper.getText).mockResolvedValue(request1Body);
    const key1 = await kvKeyFromRequest(mockRequest, 0, null);
    cacheStorage.set(key1, {
      headers: { "Content-Type": "application/json" },
      latency: 100,
      body: ['{"answer":"4"}'],
    });
    
    // Request 2 with different content
    const request2Body = JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: "What is 3+3?" }],
    });
    
    // Manually populate cache for request 2
    vi.mocked(mockRequest.requestWrapper.getText).mockResolvedValue(request2Body);
    const key2 = await kvKeyFromRequest(mockRequest, 0, null);
    cacheStorage.set(key2, {
      headers: { "Content-Type": "application/json" },
      latency: 150,
      body: ['{"answer":"6"}'],
    });
    
    // Retrieve request 1
    vi.mocked(mockRequest.requestWrapper.getText).mockResolvedValue(request1Body);
    const cached1 = await getCachedResponse(
      mockRequest,
      { bucketSize: 1 },
      mockCacheKv,
      null
    );
    const body1 = await cached1?.text();
    expect(body1).toBe('{"answer":"4"}');
    
    // Retrieve request 2
    vi.mocked(mockRequest.requestWrapper.getText).mockResolvedValue(request2Body);
    const cached2 = await getCachedResponse(
      mockRequest,
      { bucketSize: 1 },
      mockCacheKv,
      null
    );
    const body2 = await cached2?.text();
    expect(body2).toBe('{"answer":"6"}');
  });

  it("should respect cache-ignore-keys when caching", async () => {
    // First request with timestamp
    const request1 = JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: "Hello" }],
      timestamp: "2024-01-01T00:00:00Z",
      request_id: "req-123",
    });
    
    mockRequest.requestWrapper.getText.mockResolvedValue(request1);
    mockRequest.requestWrapper.heliconeHeaders.cacheHeaders.cacheIgnoreKeys = ["timestamp", "request_id"];
    
    // Save response
    await saveToCache({
      request: mockRequest,
      response: new Response('{"greeting":"Hi there!"}'),
      responseBody: ['{"greeting":"Hi there!"}'],
      responseLatencyMs: 50,
      cacheControl: "max-age=3600",
      settings: { bucketSize: 1 },
      cacheKv: mockCacheKv,
      cacheSeed: null,
    });
    
    // Second request with different timestamp and request_id but same content
    const request2 = JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: "Hello" }],
      timestamp: "2024-02-02T00:00:00Z",
      request_id: "req-456",
    });
    
    mockRequest.requestWrapper.getText.mockResolvedValue(request2);
    
    // Should hit cache despite different timestamp and request_id
    const cachedResponse = await getCachedResponse(
      mockRequest,
      { bucketSize: 1 },
      mockCacheKv,
      null
    );
    
    expect(cachedResponse).not.toBeNull();
    expect(cachedResponse?.headers.get("Helicone-Cache")).toBe("HIT");
    const body = await cachedResponse?.text();
    expect(body).toBe('{"greeting":"Hi there!"}');
  });

  it("should handle multiple cache buckets", async () => {
    const requestBody = JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: "Tell me a joke" }],
    });
    mockRequest.requestWrapper.getText.mockResolvedValue(requestBody);
    
    // Save 3 different responses in different buckets
    const responses = [
      '{"joke":"Why did the chicken cross the road?"}',
      '{"joke":"What do you call a bear with no teeth?"}',
      '{"joke":"Why dont scientists trust atoms?"}',
    ];
    
    // Manually populate cache buckets
    for (let i = 0; i < 3; i++) {
      const key = await kvKeyFromRequest(mockRequest, i, null);
      cacheStorage.set(key, {
        headers: { "Content-Type": "application/json" },
        latency: 100 + i * 10,
        body: [responses[i]],
      });
    }
    
    // Retrieve from cache - should get one of the 3 responses
    const cachedResponse = await getCachedResponse(
      mockRequest,
      { bucketSize: 3 },
      mockCacheKv,
      null
    );
    
    expect(cachedResponse).not.toBeNull();
    expect(cachedResponse?.headers.get("Helicone-Cache")).toBe("HIT");
    
    const bucketIdx = cachedResponse?.headers.get("Helicone-Cache-Bucket-Idx");
    expect(bucketIdx).toBeDefined();
    expect(["0", "1", "2"]).toContain(bucketIdx);
    
    const body = await cachedResponse?.text();
    expect(responses).toContain(body);
  });
});