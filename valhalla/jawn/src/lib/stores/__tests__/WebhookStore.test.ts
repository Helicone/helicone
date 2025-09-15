import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import { WebhookStore } from "../WebhookStore";
import { Database } from "../../db/database.types";

// Mock dbExecute
jest.mock("../../shared/db/dbExecute", () => ({
  dbExecute: jest.fn(),
}));

import { dbExecute } from "../../shared/db/dbExecute";

describe("WebhookStore", () => {
  let webhookStore: WebhookStore;
  const mockDbExecute = dbExecute as jest.MockedFunction<typeof dbExecute>;

  beforeEach(() => {
    jest.clearAllMocks();
    webhookStore = new WebhookStore();
  });

  describe("getWebhooksByOrgId", () => {
    const testOrgId = "test-org-123";

    test("should successfully retrieve webhooks for an organization", async () => {
      const mockWebhooks: Database["public"]["Tables"]["webhooks"]["Row"][] = [
        {
          id: 1,
          org_id: testOrgId,
          destination: "https://example.com/webhook1",
          version: "v1",
          config: { sampleRate: 100 },
          created_at: "2024-01-01T00:00:00Z",
          hmac_key: "secret-key-1",
          is_verified: true,
          txt_record: "helicone-verify-1",
        },
        {
          id: 2,
          org_id: testOrgId,
          destination: "https://example.com/webhook2",
          version: "v1",
          config: { sampleRate: 50 },
          created_at: "2024-01-02T00:00:00Z",
          hmac_key: "secret-key-2",
          is_verified: true,
          txt_record: "helicone-verify-2",
        },
      ];

      mockDbExecute.mockResolvedValueOnce({
        data: mockWebhooks,
        error: null,
      });

      const result = await webhookStore.getWebhooksByOrgId(testOrgId);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockWebhooks);
      expect(mockDbExecute).toHaveBeenCalledWith(
        `SELECT *
         FROM webhooks
         WHERE org_id = $1`,
        [testOrgId]
      );
    });

    test("should return empty array when no webhooks exist for organization", async () => {
      mockDbExecute.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await webhookStore.getWebhooksByOrgId(testOrgId);

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
      expect(mockDbExecute).toHaveBeenCalledWith(
        `SELECT *
         FROM webhooks
         WHERE org_id = $1`,
        [testOrgId]
      );
    });

    test("should handle database errors from dbExecute", async () => {
      const dbError = "Database connection failed";
      mockDbExecute.mockResolvedValueOnce({
        data: null,
        error: dbError,
      });

      const result = await webhookStore.getWebhooksByOrgId(testOrgId);

      expect(result.error).toBe(`Failed to get webhooks for org ${testOrgId}: ${dbError}`);
      expect(result.data).toBeNull();
    });

    test("should handle null data with no error from dbExecute", async () => {
      mockDbExecute.mockResolvedValueOnce({
        data: null,
        error: null,
      } as any);

      const result = await webhookStore.getWebhooksByOrgId(testOrgId);

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });

    test("should handle exceptions thrown by dbExecute", async () => {
      const error = new Error("Unexpected database error");
      mockDbExecute.mockRejectedValueOnce(error);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const result = await webhookStore.getWebhooksByOrgId(testOrgId);

      expect(result.error).toBe(`Failed to get webhooks for org ${testOrgId}: ${error.toString()}`);
      expect(result.data).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Error fetching webhooks:", error);

      consoleSpy.mockRestore();
    });

    test("should handle non-Error exceptions", async () => {
      const errorString = "String error message";
      mockDbExecute.mockRejectedValueOnce(errorString);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const result = await webhookStore.getWebhooksByOrgId(testOrgId);

      expect(result.error).toBe(`Failed to get webhooks for org ${testOrgId}: ${errorString}`);
      expect(result.data).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Error fetching webhooks:", errorString);

      consoleSpy.mockRestore();
    });

    test("should handle multiple organizations with different webhooks", async () => {
      const orgId1 = "org-1";
      const orgId2 = "org-2";
      const orgId3 = "org-3";

      const webhooksOrg1: Database["public"]["Tables"]["webhooks"]["Row"][] = [
        {
          id: 1,
          org_id: orgId1,
          destination: "https://org1.com/webhook1",
          version: "v1",
          config: { sampleRate: 100 },
          created_at: "2024-01-01T00:00:00Z",
          hmac_key: "org1-key-1",
          is_verified: true,
          txt_record: "verify-org1-1",
        },
        {
          id: 2,
          org_id: orgId1,
          destination: "https://org1.com/webhook2",
          version: "v1",
          config: { sampleRate: 75 },
          created_at: "2024-01-02T00:00:00Z",
          hmac_key: "org1-key-2",
          is_verified: true,
          txt_record: "verify-org1-2",
        },
      ];

      const webhooksOrg2: Database["public"]["Tables"]["webhooks"]["Row"][] = [
        {
          id: 3,
          org_id: orgId2,
          destination: "https://org2.com/webhook1",
          version: "v2",
          config: { sampleRate: 50, includeData: true },
          created_at: "2024-01-03T00:00:00Z",
          hmac_key: "org2-key-1",
          is_verified: false,
          txt_record: "verify-org2-1",
        },
        {
          id: 4,
          org_id: orgId2,
          destination: "https://org2.com/webhook2",
          version: "v2",
          config: { sampleRate: 25, includeData: false },
          created_at: "2024-01-04T00:00:00Z",
          hmac_key: "org2-key-2",
          is_verified: true,
          txt_record: "verify-org2-2",
        },
        {
          id: 5,
          org_id: orgId2,
          destination: "https://org2.com/webhook3",
          version: "v2",
          config: { sampleRate: 100 },
          created_at: "2024-01-05T00:00:00Z",
          hmac_key: "org2-key-3",
          is_verified: true,
          txt_record: "verify-org2-3",
        },
      ];

      const webhooksOrg3: Database["public"]["Tables"]["webhooks"]["Row"][] = [];

      // Mock the database responses for each org
      mockDbExecute.mockResolvedValueOnce({
        data: webhooksOrg1,
        error: null,
      });

      mockDbExecute.mockResolvedValueOnce({
        data: webhooksOrg2,
        error: null,
      });

      mockDbExecute.mockResolvedValueOnce({
        data: webhooksOrg3,
        error: null,
      });

      // Test org1 - has 2 webhooks
      const result1 = await webhookStore.getWebhooksByOrgId(orgId1);
      expect(result1.error).toBeNull();
      expect(result1.data).toHaveLength(2);
      expect(result1.data).toEqual(webhooksOrg1);

      // Test org2 - has 3 webhooks
      const result2 = await webhookStore.getWebhooksByOrgId(orgId2);
      expect(result2.error).toBeNull();
      expect(result2.data).toHaveLength(3);
      expect(result2.data).toEqual(webhooksOrg2);

      // Test org3 - has no webhooks
      const result3 = await webhookStore.getWebhooksByOrgId(orgId3);
      expect(result3.error).toBeNull();
      expect(result3.data).toHaveLength(0);
      expect(result3.data).toEqual([]);

      // Verify correct SQL calls were made
      expect(mockDbExecute).toHaveBeenCalledTimes(3);
      expect(mockDbExecute).toHaveBeenNthCalledWith(
        1,
        `SELECT *
         FROM webhooks
         WHERE org_id = $1`,
        [orgId1]
      );
      expect(mockDbExecute).toHaveBeenNthCalledWith(
        2,
        `SELECT *
         FROM webhooks
         WHERE org_id = $1`,
        [orgId2]
      );
      expect(mockDbExecute).toHaveBeenNthCalledWith(
        3,
        `SELECT *
         FROM webhooks
         WHERE org_id = $1`,
        [orgId3]
      );
    });

    test("should handle retrieving large number of webhooks", async () => {
      const largeOrgId = "large-org";
      const numberOfWebhooks = 100;

      // Create a large array of webhooks
      const manyWebhooks: Database["public"]["Tables"]["webhooks"]["Row"][] = Array.from(
        { length: numberOfWebhooks },
        (_, index) => ({
          id: index + 1,
          org_id: largeOrgId,
          destination: `https://example.com/webhook${index + 1}`,
          version: "v1",
          config: { 
            sampleRate: Math.floor(Math.random() * 100) + 1,
            propertyFilters: index % 3 === 0 ? [{ key: "env", value: "production" }] : [],
          },
          created_at: new Date(2024, 0, index + 1).toISOString(),
          hmac_key: `key-${index + 1}`,
          is_verified: index % 2 === 0,
          txt_record: `verify-${index + 1}`,
        })
      );

      mockDbExecute.mockResolvedValueOnce({
        data: manyWebhooks,
        error: null,
      });

      const result = await webhookStore.getWebhooksByOrgId(largeOrgId);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(numberOfWebhooks);
      expect(result.data).toEqual(manyWebhooks);
      
      // Verify all webhooks have the correct org_id
      result.data?.forEach(webhook => {
        expect(webhook.org_id).toBe(largeOrgId);
      });
    });

    test("should correctly retrieve webhooks with various configurations", async () => {
      const testOrgWithConfigs = "org-with-configs";

      const webhooksWithDifferentConfigs: Database["public"]["Tables"]["webhooks"]["Row"][] = [
        {
          id: 101,
          org_id: testOrgWithConfigs,
          destination: "https://example.com/webhook-full",
          version: "v2",
          config: {
            sampleRate: 100,
            includeData: true,
            propertyFilters: [
              { key: "environment", value: "production" },
              { key: "model", value: "gpt-4" },
            ],
            headers: { "X-Custom-Header": "value" },
          },
          created_at: "2024-06-01T00:00:00Z",
          hmac_key: "full-config-key",
          is_verified: true,
          txt_record: "verify-full",
        },
        {
          id: 102,
          org_id: testOrgWithConfigs,
          destination: "https://example.com/webhook-minimal",
          version: "v1",
          config: null,
          created_at: "2024-06-02T00:00:00Z",
          hmac_key: null,
          is_verified: false,
          txt_record: "verify-minimal",
        },
        {
          id: 103,
          org_id: testOrgWithConfigs,
          destination: "https://example.com/webhook-partial",
          version: "v1",
          config: {
            sampleRate: 50,
          },
          created_at: "2024-06-03T00:00:00Z",
          hmac_key: "partial-key",
          is_verified: true,
          txt_record: "verify-partial",
        },
      ];

      mockDbExecute.mockResolvedValueOnce({
        data: webhooksWithDifferentConfigs,
        error: null,
      });

      const result = await webhookStore.getWebhooksByOrgId(testOrgWithConfigs);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(3);
      
      // Check webhook with full config
      const fullConfigWebhook = result.data?.find(w => w.id === 101);
      expect(fullConfigWebhook?.config).toEqual({
        sampleRate: 100,
        includeData: true,
        propertyFilters: [
          { key: "environment", value: "production" },
          { key: "model", value: "gpt-4" },
        ],
        headers: { "X-Custom-Header": "value" },
      });

      // Check webhook with null config
      const minimalWebhook = result.data?.find(w => w.id === 102);
      expect(minimalWebhook?.config).toBeNull();
      expect(minimalWebhook?.hmac_key).toBeNull();

      // Check webhook with partial config
      const partialWebhook = result.data?.find(w => w.id === 103);
      expect(partialWebhook?.config).toEqual({ sampleRate: 50 });
    });
  });

  describe("getWebhookSubscriptionByWebhookId", () => {
    const testWebhookId = 123;

    test("should successfully retrieve subscriptions for a webhook", async () => {
      const mockSubscriptions: Database["public"]["Tables"]["webhook_subscriptions"]["Row"][] = [
        {
          id: 1,
          webhook_id: testWebhookId,
          event: "request.created",
          created_at: "2024-01-01T00:00:00Z",
          payload_type: { type: "full" },
        },
        {
          id: 2,
          webhook_id: testWebhookId,
          event: "request.updated",
          created_at: "2024-01-02T00:00:00Z",
          payload_type: { type: "minimal" },
        },
      ];

      mockDbExecute.mockResolvedValueOnce({
        data: mockSubscriptions,
        error: null,
      });

      const result = await webhookStore.getWebhookSubscriptionByWebhookId(testWebhookId);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockSubscriptions);
      expect(mockDbExecute).toHaveBeenCalledWith(
        `SELECT *
         FROM webhook_subscriptions
         WHERE webhook_id = $1`,
        [testWebhookId]
      );
    });

    test("should return empty array when no subscriptions exist for webhook", async () => {
      mockDbExecute.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await webhookStore.getWebhookSubscriptionByWebhookId(testWebhookId);

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
      expect(mockDbExecute).toHaveBeenCalledWith(
        `SELECT *
         FROM webhook_subscriptions
         WHERE webhook_id = $1`,
        [testWebhookId]
      );
    });

    test("should handle database errors from dbExecute", async () => {
      const dbError = "Query execution failed";
      mockDbExecute.mockResolvedValueOnce({
        data: null,
        error: dbError,
      });

      const result = await webhookStore.getWebhookSubscriptionByWebhookId(testWebhookId);

      expect(result.error).toBe(
        `Failed to get webhook subscriptions for webhook ${testWebhookId}: ${dbError}`
      );
      expect(result.data).toBeNull();
    });

    test("should handle null data with no error from dbExecute", async () => {
      mockDbExecute.mockResolvedValueOnce({
        data: null,
        error: null,
      } as any);

      const result = await webhookStore.getWebhookSubscriptionByWebhookId(testWebhookId);

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });

    test("should handle exceptions thrown by dbExecute", async () => {
      const error = new Error("Connection timeout");
      mockDbExecute.mockRejectedValueOnce(error);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const result = await webhookStore.getWebhookSubscriptionByWebhookId(testWebhookId);

      expect(result.error).toBe(
        `Failed to get webhook subscriptions for webhook ${testWebhookId}: ${error.toString()}`
      );
      expect(result.data).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Error fetching webhook subscriptions:", error);

      consoleSpy.mockRestore();
    });

    test("should handle non-Error exceptions", async () => {
      const errorObject = { code: "DB_ERROR", message: "Database unavailable" };
      mockDbExecute.mockRejectedValueOnce(errorObject);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const result = await webhookStore.getWebhookSubscriptionByWebhookId(testWebhookId);

      expect(result.error).toBe(
        `Failed to get webhook subscriptions for webhook ${testWebhookId}: ${String(errorObject)}`
      );
      expect(result.data).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Error fetching webhook subscriptions:", errorObject);

      consoleSpy.mockRestore();
    });

    test("should handle different webhook IDs correctly", async () => {
      const webhookId1 = 456;
      const webhookId2 = 789;

      const mockSubscriptions1: Database["public"]["Tables"]["webhook_subscriptions"]["Row"][] = [
        {
          id: 3,
          webhook_id: webhookId1,
          event: "response.received",
          created_at: "2024-01-03T00:00:00Z",
          payload_type: { type: "full" },
        },
      ];

      const mockSubscriptions2: Database["public"]["Tables"]["webhook_subscriptions"]["Row"][] = [
        {
          id: 4,
          webhook_id: webhookId2,
          event: "error.occurred",
          created_at: "2024-01-04T00:00:00Z",
          payload_type: { type: "error" },
        },
      ];

      mockDbExecute.mockResolvedValueOnce({
        data: mockSubscriptions1,
        error: null,
      });

      mockDbExecute.mockResolvedValueOnce({
        data: mockSubscriptions2,
        error: null,
      });

      const result1 = await webhookStore.getWebhookSubscriptionByWebhookId(webhookId1);
      const result2 = await webhookStore.getWebhookSubscriptionByWebhookId(webhookId2);

      expect(result1.data).toEqual(mockSubscriptions1);
      expect(result2.data).toEqual(mockSubscriptions2);
      expect(mockDbExecute).toHaveBeenCalledTimes(2);
      expect(mockDbExecute).toHaveBeenNthCalledWith(
        1,
        `SELECT *
         FROM webhook_subscriptions
         WHERE webhook_id = $1`,
        [webhookId1]
      );
      expect(mockDbExecute).toHaveBeenNthCalledWith(
        2,
        `SELECT *
         FROM webhook_subscriptions
         WHERE webhook_id = $1`,
        [webhookId2]
      );
    });

    test("should handle multiple webhooks with different subscription counts", async () => {
      const webhook1Id = 1001;
      const webhook2Id = 1002;
      const webhook3Id = 1003;
      const webhook4Id = 1004;

      // Webhook 1: Has multiple subscriptions
      const webhook1Subscriptions: Database["public"]["Tables"]["webhook_subscriptions"]["Row"][] = [
        {
          id: 1,
          webhook_id: webhook1Id,
          event: "request.created",
          created_at: "2024-01-01T00:00:00Z",
          payload_type: { type: "full" },
        },
        {
          id: 2,
          webhook_id: webhook1Id,
          event: "request.updated",
          created_at: "2024-01-01T00:00:00Z",
          payload_type: { type: "full" },
        },
        {
          id: 3,
          webhook_id: webhook1Id,
          event: "request.deleted",
          created_at: "2024-01-01T00:00:00Z",
          payload_type: { type: "minimal" },
        },
        {
          id: 4,
          webhook_id: webhook1Id,
          event: "response.received",
          created_at: "2024-01-01T00:00:00Z",
          payload_type: { type: "full" },
        },
      ];

      // Webhook 2: Has one subscription
      const webhook2Subscriptions: Database["public"]["Tables"]["webhook_subscriptions"]["Row"][] = [
        {
          id: 5,
          webhook_id: webhook2Id,
          event: "error.occurred",
          created_at: "2024-01-02T00:00:00Z",
          payload_type: { type: "error" },
        },
      ];

      // Webhook 3: Has no subscriptions
      const webhook3Subscriptions: Database["public"]["Tables"]["webhook_subscriptions"]["Row"][] = [];

      // Webhook 4: Has many subscriptions (testing scale)
      const webhook4Subscriptions: Database["public"]["Tables"]["webhook_subscriptions"]["Row"][] = 
        Array.from({ length: 50 }, (_, index) => ({
          id: 100 + index,
          webhook_id: webhook4Id,
          event: `event.type.${index}`,
          created_at: new Date(2024, 0, Math.floor(index / 10) + 1).toISOString(),
          payload_type: { type: index % 3 === 0 ? "full" : index % 3 === 1 ? "minimal" : "error" },
        }));

      // Mock the responses
      mockDbExecute.mockResolvedValueOnce({
        data: webhook1Subscriptions,
        error: null,
      });

      mockDbExecute.mockResolvedValueOnce({
        data: webhook2Subscriptions,
        error: null,
      });

      mockDbExecute.mockResolvedValueOnce({
        data: webhook3Subscriptions,
        error: null,
      });

      mockDbExecute.mockResolvedValueOnce({
        data: webhook4Subscriptions,
        error: null,
      });

      // Test webhook 1 - multiple subscriptions
      const result1 = await webhookStore.getWebhookSubscriptionByWebhookId(webhook1Id);
      expect(result1.error).toBeNull();
      expect(result1.data).toHaveLength(4);
      expect(result1.data).toEqual(webhook1Subscriptions);

      // Test webhook 2 - single subscription
      const result2 = await webhookStore.getWebhookSubscriptionByWebhookId(webhook2Id);
      expect(result2.error).toBeNull();
      expect(result2.data).toHaveLength(1);
      expect(result2.data?.[0].event).toBe("error.occurred");

      // Test webhook 3 - no subscriptions
      const result3 = await webhookStore.getWebhookSubscriptionByWebhookId(webhook3Id);
      expect(result3.error).toBeNull();
      expect(result3.data).toHaveLength(0);

      // Test webhook 4 - many subscriptions
      const result4 = await webhookStore.getWebhookSubscriptionByWebhookId(webhook4Id);
      expect(result4.error).toBeNull();
      expect(result4.data).toHaveLength(50);
      
      // Verify all subscriptions belong to the correct webhook
      result4.data?.forEach(subscription => {
        expect(subscription.webhook_id).toBe(webhook4Id);
      });

      // Verify the variety of payload types
      const payloadTypes = result4.data?.map(s => (s.payload_type as any).type);
      expect(payloadTypes).toContain("full");
      expect(payloadTypes).toContain("minimal");
      expect(payloadTypes).toContain("error");

      // Verify correct number of calls
      expect(mockDbExecute).toHaveBeenCalledTimes(4);
    });

    test("should handle concurrent calls for different webhook subscriptions", async () => {
      const webhookIds = [2001, 2002, 2003, 2004, 2005];
      
      // Create different subscription sets for each webhook
      const subscriptionSets = webhookIds.map(webhookId => ({
        webhookId,
        subscriptions: Array.from({ length: webhookId % 5 + 1 }, (_, index) => ({
          id: webhookId * 100 + index,
          webhook_id: webhookId,
          event: `event.${webhookId}.${index}`,
          created_at: "2024-01-01T00:00:00Z",
          payload_type: { type: "full" },
        })),
      }));

      // Mock all responses
      subscriptionSets.forEach(({ subscriptions }) => {
        mockDbExecute.mockResolvedValueOnce({
          data: subscriptions,
          error: null,
        });
      });

      // Make concurrent calls
      const promises = webhookIds.map(webhookId => 
        webhookStore.getWebhookSubscriptionByWebhookId(webhookId)
      );

      const results = await Promise.all(promises);

      // Verify all results
      results.forEach((result, index) => {
        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(subscriptionSets[index].subscriptions.length);
        expect(result.data).toEqual(subscriptionSets[index].subscriptions);
      });

      // Verify all database calls were made
      expect(mockDbExecute).toHaveBeenCalledTimes(webhookIds.length);
    });
    
    test("should handle mixed success and failure scenarios for multiple webhooks", async () => {
      const successWebhookId = 3001;
      const failureWebhookId = 3002;
      const emptyWebhookId = 3003;

      const successSubscriptions: Database["public"]["Tables"]["webhook_subscriptions"]["Row"][] = [
        {
          id: 1,
          webhook_id: successWebhookId,
          event: "success.event",
          created_at: "2024-01-01T00:00:00Z",
          payload_type: { type: "full" },
        },
      ];

      // First call succeeds
      mockDbExecute.mockResolvedValueOnce({
        data: successSubscriptions,
        error: null,
      });

      // Second call fails
      mockDbExecute.mockResolvedValueOnce({
        data: null,
        error: "Database connection lost",
      });

      // Third call returns empty
      mockDbExecute.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result1 = await webhookStore.getWebhookSubscriptionByWebhookId(successWebhookId);
      const result2 = await webhookStore.getWebhookSubscriptionByWebhookId(failureWebhookId);
      const result3 = await webhookStore.getWebhookSubscriptionByWebhookId(emptyWebhookId);

      // Verify success case
      expect(result1.error).toBeNull();
      expect(result1.data).toHaveLength(1);
      expect(result1.data).toEqual(successSubscriptions);

      // Verify failure case
      expect(result2.error).toBe(
        `Failed to get webhook subscriptions for webhook ${failureWebhookId}: Database connection lost`
      );
      expect(result2.data).toBeNull();

      // Verify empty case
      expect(result3.error).toBeNull();
      expect(result3.data).toHaveLength(0);
    });
  });
});