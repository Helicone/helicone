import { registry } from "../../cost/models/registry";
import { describe, it, expect } from "@jest/globals";

describe("Helicone Test Models - Registry Integration", () => {
  describe("Model Registration", () => {
    it("should register all test models in registry", () => {
      const models = registry.getAllModelIds();
      expect(models.data).toContain("helicone-test-free");
      expect(models.data).toContain("helicone-test-cheap");
      expect(models.data).toContain("helicone-test-expensive");
    });

    it("should have correct metadata for free model", () => {
      const allModels = registry.getAllModelsWithIds();

      const freeModel = allModels.data?.["helicone-test-free"];
      expect(freeModel).toBeDefined();
      expect(freeModel?.author).toBe("helicone");
      expect(freeModel?.name).toBe("Helicone: Test Free");
      expect(freeModel?.contextLength).toBe(128000);
      expect(freeModel?.maxOutputTokens).toBe(4096);
      expect(freeModel?.tokenizer).toBe("GPT");
      expect(freeModel?.modality).toEqual({
        inputs: ["text"],
        outputs: ["text"],
      });
    });

    it("should have correct metadata for cheap model", () => {
      const allModels = registry.getAllModelsWithIds();

      const cheapModel = allModels.data?.["helicone-test-cheap"];
      expect(cheapModel).toBeDefined();
      expect(cheapModel?.author).toBe("helicone");
      expect(cheapModel?.name).toBe("Helicone: Test Cheap");
      expect(cheapModel?.contextLength).toBe(128000);
      expect(cheapModel?.maxOutputTokens).toBe(4096);
    });

    it("should have correct metadata for expensive model", () => {
      const allModels = registry.getAllModelsWithIds();

      const expensiveModel = allModels.data?.["helicone-test-expensive"];
      expect(expensiveModel).toBeDefined();
      expect(expensiveModel?.author).toBe("helicone");
      expect(expensiveModel?.name).toBe("Helicone: Test Expensive");
      expect(expensiveModel?.description).toContain("high cost pricing");
    });
  });

  describe("Endpoint Discovery", () => {
    it("should find endpoints for free model", () => {
      const endpoints = registry.getEndpointsByModel("helicone-test-free");
      expect(endpoints.data).toBeDefined();
      expect(endpoints.data?.length).toBeGreaterThan(0);

      const endpoint = endpoints.data?.[0];
      expect(endpoint?.providerModelId).toBe("helicone-test-free");
    });

    it("should find endpoints for cheap model", () => {
      const endpoints = registry.getEndpointsByModel("helicone-test-cheap");
      expect(endpoints.data).toBeDefined();
      expect(endpoints.data?.length).toBeGreaterThan(0);
    });

    it("should find endpoints for expensive model", () => {
      const endpoints = registry.getEndpointsByModel("helicone-test-expensive");
      expect(endpoints.data).toBeDefined();
      expect(endpoints.data?.length).toBeGreaterThan(0);
    });
  });

  describe("Provider Configuration", () => {
    it("should use openai provider for test models", () => {
      const entry = registry.getModelProviderEntry(
        "helicone-test-free",
        "openai"
      );

      expect(entry.data).toBeDefined();
      expect(entry.data?.provider).toBe("openai");
      expect(entry.data?.config.author).toBe("helicone");
    });

    it("should have correct providerModelId", () => {
      const models = [
        "helicone-test-free",
        "helicone-test-cheap",
        "helicone-test-expensive",
      ];

      models.forEach((modelName) => {
        const entry = registry.getModelProviderEntry(modelName, "openai");
        expect(entry.data?.config.providerModelId).toBe(modelName);
      });
    });

    it("should disable PTB for test models", () => {
      const models = [
        "helicone-test-free",
        "helicone-test-cheap",
        "helicone-test-expensive",
      ];

      models.forEach((modelName) => {
        const entry = registry.getModelProviderEntry(modelName, "openai");
        expect(entry.data?.config.ptbEnabled).toBe(false);
      });
    });

    it("should have correct context length and max tokens", () => {
      const entry = registry.getModelProviderEntry(
        "helicone-test-free",
        "openai"
      );

      expect(entry.data?.config.contextLength).toBe(128000);
      expect(entry.data?.config.maxCompletionTokens).toBe(4096);
    });
  });

  describe("Endpoint Building", () => {
    it("should build endpoint for free model", () => {
      const entry = registry.getModelProviderEntry(
        "helicone-test-free",
        "openai"
      );
      expect(entry.data).toBeDefined();

      const endpoint = registry.buildEndpoint(entry.data!.config, {
        gatewayMapping: "OPENAI",
        modelName: "helicone-test-free",
      });

      expect(endpoint.data).toBeDefined();
      expect(endpoint.data?.providerModelId).toBe("helicone-test-free");
      expect(endpoint.data?.provider).toBe("openai");
      expect(endpoint.data?.ptbEnabled).toBe(false);
    });

    it("should build endpoint with correct parameters", () => {
      const entry = registry.getModelProviderEntry(
        "helicone-test-cheap",
        "openai"
      );
      const endpoint = registry.buildEndpoint(entry.data!.config, {
        gatewayMapping: "OPENAI",
        modelName: "helicone-test-cheap",
      });

      expect(endpoint.data?.contextLength).toBe(128000);
      expect(endpoint.data?.maxCompletionTokens).toBe(4096);
      expect(endpoint.data?.supportedParameters).toContain("max_tokens");
      expect(endpoint.data?.supportedParameters).toContain("temperature");
      expect(endpoint.data?.supportedParameters).toContain("stream");
    });
  });
});
