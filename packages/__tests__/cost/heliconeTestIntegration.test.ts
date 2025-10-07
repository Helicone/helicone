import { registry } from "../../cost/models/registry";
import { modelCostBreakdownFromRegistry } from "../../cost/costCalc";
import { describe, it, expect } from "@jest/globals";
import type { ModelUsage } from "../../cost/usage/types";

describe("Helicone Test Models - End-to-End Integration", () => {
  describe("Complete Flow: Registry → Endpoint → Cost", () => {
    it("should work end-to-end for free model", () => {
      // 1. Verify model exists in registry
      const modelIds = registry.getAllModelIds();
      expect(modelIds.data).toContain("helicone-test-free");

      // 2. Get model config
      const allModels = registry.getAllModelsWithIds();
      const model = allModels.data?.["helicone-test-free"];
      expect(model).toBeDefined();
      expect(model?.author).toBe("helicone");

      // 3. Get endpoint for model
      const entry = registry.getModelProviderEntry("helicone-test-free", "openai");
      expect(entry.data).toBeDefined();
      expect(entry.data?.provider).toBe("openai");

      // 4. Build endpoint
      const endpoint = registry.buildEndpoint(entry.data!.config, {
        gatewayMapping: "OPENAI",
        modelName: "helicone-test-free"
      });
      expect(endpoint.data).toBeDefined();
      expect(endpoint.data?.providerModelId).toBe("helicone-test-free");

      // 5. Calculate cost
      const modelUsage: ModelUsage = { input: 1000, output: 500 };
      const cost = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "helicone-test-free",
        provider: "openai",
      });
      expect(cost?.totalCost).toBe(0);
    });

    it("should work end-to-end for cheap model", () => {
      // Complete flow
      const modelIds = registry.getAllModelIds();
      expect(modelIds.data).toContain("helicone-test-cheap");

      const entry = registry.getModelProviderEntry("helicone-test-cheap", "openai");
      expect(entry.data).toBeDefined();

      const endpoint = registry.buildEndpoint(entry.data!.config, {
        gatewayMapping: "OPENAI",
        modelName: "helicone-test-cheap"
      });
      expect(endpoint.data).toBeDefined();

      const cost = modelCostBreakdownFromRegistry({
        modelUsage: { input: 100000, output: 50000 },
        providerModelId: "helicone-test-cheap",
        provider: "openai",
      });
      expect(cost?.totalCost).toBeGreaterThan(0);
      // 100K × $0.0000001 = $0.01 input, 50K × $0.0000002 = $0.01 output
      expect(cost?.totalCost).toBeCloseTo(0.01 + 0.01, 3);
    });

    it("should work end-to-end for expensive model", () => {
      const modelIds = registry.getAllModelIds();
      expect(modelIds.data).toContain("helicone-test-expensive");

      const entry = registry.getModelProviderEntry("helicone-test-expensive", "openai");
      const endpoint = registry.buildEndpoint(entry.data!.config, {
        gatewayMapping: "OPENAI",
        modelName: "helicone-test-expensive"
      });

      expect(endpoint.data?.pricing?.[0]?.input).toBe(0.00001);
      expect(endpoint.data?.pricing?.[0]?.output).toBe(0.00002);

      const cost = modelCostBreakdownFromRegistry({
        modelUsage: { input: 10000, output: 5000 },
        providerModelId: "helicone-test-expensive",
        provider: "openai",
      });
      expect(cost?.totalCost).toBeCloseTo(0.1 + 0.1, 2); // $0.1 input + $0.1 output
    });
  });

  describe("Pricing Tier Verification", () => {
    it("should have distinct pricing for each tier", () => {
      const freeEntry = registry.getModelProviderEntry("helicone-test-free", "openai");
      const cheapEntry = registry.getModelProviderEntry("helicone-test-cheap", "openai");
      const expensiveEntry = registry.getModelProviderEntry("helicone-test-expensive", "openai");

      // Free: $0
      expect(freeEntry.data?.config.pricing[0]?.input).toBe(0);
      expect(freeEntry.data?.config.pricing[0]?.output).toBe(0);

      // Cheap: $0.0001 / $0.0002
      expect(cheapEntry.data?.config.pricing[0]?.input).toBe(0.0000001);
      expect(cheapEntry.data?.config.pricing[0]?.output).toBe(0.0000002);

      // Expensive: $0.01 / $0.02
      expect(expensiveEntry.data?.config.pricing[0]?.input).toBe(0.00001);
      expect(expensiveEntry.data?.config.pricing[0]?.output).toBe(0.00002);
    });

    it("should maintain price ratio between tiers", () => {
      const cheapEntry = registry.getModelProviderEntry("helicone-test-cheap", "openai");
      const expensiveEntry = registry.getModelProviderEntry("helicone-test-expensive", "openai");

      const cheapInput = cheapEntry.data?.config.pricing[0]?.input ?? 0;
      const expensiveInput = expensiveEntry.data?.config.pricing[0]?.input ?? 0;

      // Expensive should be 100x more expensive than cheap
      expect(expensiveInput / cheapInput).toBeCloseTo(100, 1);
    });
  });

  describe("Configuration Consistency", () => {
    it("should have consistent context length across all test models", () => {
      const models = ["helicone-test-free", "helicone-test-cheap", "helicone-test-expensive"];

      models.forEach(modelName => {
        const entry = registry.getModelProviderEntry(modelName, "openai");
        expect(entry.data?.config.contextLength).toBe(128000);
      });
    });

    it("should have consistent max completion tokens across all test models", () => {
      const models = ["helicone-test-free", "helicone-test-cheap", "helicone-test-expensive"];

      models.forEach(modelName => {
        const entry = registry.getModelProviderEntry(modelName, "openai");
        expect(entry.data?.config.maxCompletionTokens).toBe(4096);
      });
    });

    it("should all use OpenAI provider", () => {
      const models = ["helicone-test-free", "helicone-test-cheap", "helicone-test-expensive"];

      models.forEach(modelName => {
        const entry = registry.getModelProviderEntry(modelName, "openai");
        expect(entry.data?.provider).toBe("openai");
      });
    });

    it("should all disable PTB", () => {
      const models = ["helicone-test-free", "helicone-test-cheap", "helicone-test-expensive"];

      models.forEach(modelName => {
        const entry = registry.getModelProviderEntry(modelName, "openai");
        expect(entry.data?.config.ptbEnabled).toBe(false);
      });
    });
  });

  describe("Realistic Load Testing Scenarios", () => {
    it("should calculate realistic costs for 1M token load test", () => {
      const usagePerRequest: ModelUsage = {
        input: 1000,
        output: 500,
      };

      const requestCount = 1000; // 1K requests = ~1M tokens total

      // Calculate cost for 1000 requests
      const freeCost = modelCostBreakdownFromRegistry({
        modelUsage: {
          input: usagePerRequest.input * requestCount,
          output: usagePerRequest.output * requestCount,
        },
        providerModelId: "helicone-test-free",
        provider: "openai",
      });

      const cheapCost = modelCostBreakdownFromRegistry({
        modelUsage: {
          input: usagePerRequest.input * requestCount,
          output: usagePerRequest.output * requestCount,
        },
        providerModelId: "helicone-test-cheap",
        provider: "openai",
      });

      const expensiveCost = modelCostBreakdownFromRegistry({
        modelUsage: {
          input: usagePerRequest.input * requestCount,
          output: usagePerRequest.output * requestCount,
        },
        providerModelId: "helicone-test-expensive",
        provider: "openai",
      });

      expect(freeCost?.totalCost).toBe(0);
      expect(cheapCost?.totalCost).toBeGreaterThan(0);
      expect(cheapCost?.totalCost).toBeLessThan(1000); // Should be much less than $1000
      expect(expensiveCost?.totalCost).toBeGreaterThan(cheapCost?.totalCost ?? 0);
    });

    it("should handle concurrent request simulation", () => {
      // Simulate 100 concurrent requests
      const concurrentRequests = 100;
      const tokensPerRequest = 2000; // 1000 input + 1000 output avg

      const totalUsage: ModelUsage = {
        input: 1000 * concurrentRequests,
        output: 1000 * concurrentRequests,
      };

      const cost = modelCostBreakdownFromRegistry({
        modelUsage: totalUsage,
        providerModelId: "helicone-test-expensive",
        provider: "openai",
      });

      expect(cost).not.toBeNull();
      expect(cost?.totalCost).toBeGreaterThan(0);
      // Should be predictable: 100K input × $0.01 + 100K output × $0.02 = $1 + $2 = $3
      expect(cost?.totalCost).toBeCloseTo(3, 1);
    });
  });
});
