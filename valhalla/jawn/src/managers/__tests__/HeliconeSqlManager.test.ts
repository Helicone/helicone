import { HeliconeSqlManager } from "../HeliconeSqlManager";
import { AuthParams } from "../../packages/common/auth/types";

describe("HeliconeSqlManager - Simple Tests", () => {
  let manager: any;
  const mockAuthParams: AuthParams = {
    organizationId: "test-org-id",
    userId: "test-user-id",
    role: "admin",
  };

  beforeEach(() => {
    // Create manager instance with access to private methods
    manager = new HeliconeSqlManager(mockAuthParams);
  });

  describe("getRequestIdForS3", () => {
    test("should return cache reference ID when it exists and is not default UUID", () => {
      const requestId = "request-123";
      const cacheReferenceId = "cache-456";
      
      const result = manager.getRequestIdForS3(requestId, cacheReferenceId);
      
      expect(result).toBe(cacheReferenceId);
    });

    test("should return request ID when cache reference ID is default UUID", () => {
      const requestId = "request-123";
      const cacheReferenceId = "00000000-0000-0000-0000-000000000000";
      
      const result = manager.getRequestIdForS3(requestId, cacheReferenceId);
      
      expect(result).toBe(requestId);
    });

    test("should return request ID when cache reference ID is undefined", () => {
      const requestId = "request-123";
      
      const result = manager.getRequestIdForS3(requestId, undefined);
      
      expect(result).toBe(requestId);
    });

    test("should return request ID when cache reference ID is empty string", () => {
      const requestId = "request-123";
      const cacheReferenceId = "";
      
      const result = manager.getRequestIdForS3(requestId, cacheReferenceId);
      
      expect(result).toBe(requestId);
    });
  });

  describe("createRowWithNullBodies", () => {
    test("should add null bodies to a row", () => {
      const row = {
        request_id: "123",
        status: 200,
        model: "gpt-4",
      };
      
      const result = manager.createRowWithNullBodies(row);
      
      expect(result).toEqual({
        request_id: "123",
        status: 200,
        model: "gpt-4",
        request_body: null,
        response_body: null,
      });
    });

    test("should preserve existing properties when adding null bodies", () => {
      const row = {
        request_id: "123",
        existing_body: "should remain",
        nested: { data: "test" },
        array_field: [1, 2, 3],
      };
      
      const result = manager.createRowWithNullBodies(row);
      
      expect(result).toEqual({
        request_id: "123",
        existing_body: "should remain",
        nested: { data: "test" },
        array_field: [1, 2, 3],
        request_body: null,
        response_body: null,
      });
    });

    test("should handle empty row object", () => {
      const row = {};
      
      const result = manager.createRowWithNullBodies(row);
      
      expect(result).toEqual({
        request_body: null,
        response_body: null,
      });
    });
  });

  describe("enrichResultsWithS3Bodies", () => {
    test("should return empty array when no rows provided", async () => {
      const result = await manager.enrichResultsWithS3Bodies([]);
      expect(result).toEqual([]);
    });

    test("should return null when rows is null", async () => {
      const result = await manager.enrichResultsWithS3Bodies(null);
      expect(result).toBeNull();
    });

    test("should return undefined when rows is undefined", async () => {
      const result = await manager.enrichResultsWithS3Bodies(undefined);
      expect(result).toBeUndefined();
    });

    test("should return rows unchanged when request_id field is missing", async () => {
      const rows = [
        { id: "1", status: 200 },
        { id: "2", status: 201 },
      ];
      
      const result = await manager.enrichResultsWithS3Bodies(rows);
      
      expect(result).toEqual(rows);
    });

    test("should return rows unchanged when first row has no request_id", async () => {
      const rows = [
        { other_id: "1", status: 200 },
        { request_id: "2", status: 201 },  // Even though second row has request_id
      ];
      
      const result = await manager.enrichResultsWithS3Bodies(rows);
      
      expect(result).toEqual(rows);
    });
  });

  describe("fetchBodyFromS3Url", () => {
    test("should handle network errors gracefully", async () => {
      // Mock global fetch to simulate network error
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
      
      const result = await manager.fetchBodyFromS3Url("https://example.com");
      
      expect(result).toBeNull();
      
      // Restore original fetch
      global.fetch = originalFetch;
    });

    test("should return null for non-ok responses", async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });
      
      const result = await manager.fetchBodyFromS3Url("https://example.com");
      
      expect(result).toBeNull();
      
      global.fetch = originalFetch;
    });

    test("should parse valid JSON response", async () => {
      const originalFetch = global.fetch;
      const mockData = { request: "test request", response: "test response" };
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });
      
      const result = await manager.fetchBodyFromS3Url("https://example.com");
      
      expect(result).toEqual(mockData);
      
      global.fetch = originalFetch;
    });
  });
});