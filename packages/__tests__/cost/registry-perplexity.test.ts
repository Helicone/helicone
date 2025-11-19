import { describe, it, expect } from "@jest/globals";
import {
  perplexityModels,
  perplexityEndpointConfig as perplexityEndpoints,
} from "../../cost/models/authors/perplexity";
import { getUsageProcessor } from "../../cost/usage/getUsageProcessor";
import { calculateModelCostBreakdown } from "../../cost/models/calculate-cost";
import type { ModelConfig, ModelProviderConfig } from "../../cost/models/types";

describe("Perplexity Model Registry", () => {
  describe("Model Definitions", () => {
    it("should define all 5 Perplexity models", () => {
      const modelNames = Object.keys(perplexityModels);
      expect(modelNames).toHaveLength(5);
      expect(modelNames).toContain("sonar");
      expect(modelNames).toContain("sonar-pro");
      expect(modelNames).toContain("sonar-reasoning");
      expect(modelNames).toContain("sonar-reasoning-pro");
      expect(modelNames).toContain("sonar-deep-research");
    });

    it("should have correct author for all models", () => {
      Object.values(perplexityModels).forEach((model: ModelConfig) => {
        expect(model.author).toBe("perplexity");
      });
    });

    it("should have GPT tokenizer for all models", () => {
      Object.values(perplexityModels).forEach((model: ModelConfig) => {
        expect(model.tokenizer).toBe("GPT");
      });
    });

    it("should have text input/output modality", () => {
      Object.values(perplexityModels).forEach((model: ModelConfig) => {
        expect(model.modality.inputs).toContain("text");
        expect(model.modality.outputs).toContain("text");
      });
    });

    it("should have reasonable context lengths", () => {
      expect(perplexityModels["sonar"].contextLength).toBe(127000);
      expect(perplexityModels["sonar-pro"].contextLength).toBe(200000);
      expect(perplexityModels["sonar-reasoning"].contextLength).toBe(127000);
      expect(perplexityModels["sonar-reasoning-pro"].contextLength).toBe(127000);
      expect(perplexityModels["sonar-deep-research"].contextLength).toBe(127000);
    });

    it("should have max output tokens", () => {
      Object.values(perplexityModels).forEach((model: ModelConfig) => {
        expect(model.maxOutputTokens).toBe(4096);
      });
    });
  });

  describe("Endpoint Configurations", () => {
    it("should define endpoints for all models", () => {
      const endpointKeys = Object.keys(perplexityEndpoints);
      expect(endpointKeys).toHaveLength(5);
      expect(endpointKeys).toContain("sonar:perplexity");
      expect(endpointKeys).toContain("sonar-pro:perplexity");
      expect(endpointKeys).toContain("sonar-reasoning:perplexity");
      expect(endpointKeys).toContain("sonar-reasoning-pro:perplexity");
      expect(endpointKeys).toContain("sonar-deep-research:perplexity");
    });

    it("should have PTB enabled for all endpoints", () => {
      Object.values(perplexityEndpoints).forEach((endpoint: ModelProviderConfig) => {
        expect(endpoint.ptbEnabled).toBe(true);
      });
    });

    it("should have perplexity provider for all endpoints", () => {
      Object.values(perplexityEndpoints).forEach((endpoint: ModelProviderConfig) => {
        expect(endpoint.provider).toBe("perplexity");
        expect(endpoint.author).toBe("perplexity");
      });
    });

    it("should have correct model IDs", () => {
      expect(perplexityEndpoints["sonar:perplexity"].providerModelId).toBe("sonar");
      expect(perplexityEndpoints["sonar-pro:perplexity"].providerModelId).toBe("sonar-pro");
      expect(perplexityEndpoints["sonar-reasoning:perplexity"].providerModelId).toBe("sonar-reasoning");
      expect(perplexityEndpoints["sonar-reasoning-pro:perplexity"].providerModelId).toBe("sonar-reasoning-pro");
      expect(perplexityEndpoints["sonar-deep-research:perplexity"].providerModelId).toBe("sonar-deep-research");
    });

    it("should have wildcard endpoint config", () => {
      Object.values(perplexityEndpoints).forEach((endpoint: ModelProviderConfig) => {
        expect(endpoint.endpointConfigs).toHaveProperty("*");
      });
    });

    it("should support standard parameters", () => {
      const standardParams = ["max_tokens", "temperature", "top_p", "frequency_penalty", "response_format", "stop"];

      Object.values(perplexityEndpoints).forEach((endpoint: ModelProviderConfig) => {
        standardParams.forEach((param) => {
          expect(endpoint.supportedParameters).toContain(param);
        });
      });
    });

    it("should support reasoning parameter for reasoning models", () => {
      expect(perplexityEndpoints["sonar-reasoning:perplexity"].supportedParameters).toContain("reasoning");
      expect(perplexityEndpoints["sonar-reasoning-pro:perplexity"].supportedParameters).toContain("reasoning");
      expect(perplexityEndpoints["sonar-deep-research:perplexity"].supportedParameters).toContain("reasoning");
    });

    it("should not have reasoning parameter for non-reasoning models", () => {
      expect(perplexityEndpoints["sonar:perplexity"].supportedParameters).not.toContain("reasoning");
      expect(perplexityEndpoints["sonar-pro:perplexity"].supportedParameters).not.toContain("reasoning");
    });
  });

  describe("Pricing Configuration", () => {
    it("should have pricing defined for all endpoints", () => {
      Object.values(perplexityEndpoints).forEach((endpoint: ModelProviderConfig) => {
        expect(endpoint.pricing).toBeDefined();
        expect(endpoint.pricing.length).toBeGreaterThan(0);
      });
    });

    it("should have correct pricing structure", () => {
      Object.values(perplexityEndpoints).forEach((endpoint: ModelProviderConfig) => {
        const pricing = endpoint.pricing[0];
        expect(pricing.threshold).toBe(0);
        expect(pricing.input).toBeGreaterThan(0);
        expect(pricing.output).toBeGreaterThan(0);
      });
    });

    it("should have correct sonar pricing", () => {
      const pricing = perplexityEndpoints["sonar:perplexity"].pricing[0];
      expect(pricing.input).toBe(0.000001); // $1.00 per 1M tokens
      expect(pricing.output).toBe(0.000001); // $1.00 per 1M tokens
      expect(pricing.request).toBe(0.005); // $5.00 per 1K requests
      expect(pricing.web_search).toBe(0.005);
    });

    it("should have correct sonar-pro pricing", () => {
      const pricing = perplexityEndpoints["sonar-pro:perplexity"].pricing[0];
      expect(pricing.input).toBe(0.000003); // $3.00 per 1M tokens
      expect(pricing.output).toBe(0.000015); // $15.00 per 1M tokens
      expect(pricing.request).toBe(0.006); // $6.00 per 1K requests
      expect(pricing.web_search).toBe(0.006);
    });

    it("should have correct sonar-reasoning pricing", () => {
      const pricing = perplexityEndpoints["sonar-reasoning:perplexity"].pricing[0];
      expect(pricing.input).toBe(0.000001); // $1.00 per 1M tokens
      expect(pricing.output).toBe(0.000005); // $5.00 per 1M tokens
      expect(pricing.request).toBe(0.005); // $5.00 per 1K requests
      expect(pricing.web_search).toBe(0.005);
    });

    it("should have correct sonar-reasoning-pro pricing", () => {
      const pricing = perplexityEndpoints["sonar-reasoning-pro:perplexity"].pricing[0];
      expect(pricing.input).toBe(0.000002); // $2.00 per 1M tokens
      expect(pricing.output).toBe(0.000008); // $8.00 per 1M tokens
      expect(pricing.request).toBe(0.006); // $6.00 per 1K requests
      expect(pricing.web_search).toBe(0.006);
    });

    it("should have correct sonar-deep-research pricing", () => {
      const pricing = perplexityEndpoints["sonar-deep-research:perplexity"].pricing[0];
      expect(pricing.input).toBe(0.000002); // $2.00 per 1M tokens
      expect(pricing.output).toBe(0.000008); // $8.00 per 1M tokens
      expect(pricing.request).toBe(0.0); // No base request fee
      expect(pricing.web_search).toBe(0.005); // $5.00 per 1K searches
    });

    it("should have zero cost for audio and image", () => {
      Object.values(perplexityEndpoints).forEach((endpoint: ModelProviderConfig) => {
        const pricing = endpoint.pricing[0];
        expect(pricing.audio).toBe(0);
        expect(pricing.image).toBe(0);
      });
    });
  });

  describe("Usage Processor", () => {
    it("should have usage processor defined for perplexity provider", () => {
      const processor = getUsageProcessor("perplexity");
      expect(processor).toBeDefined();
      expect(processor).not.toBeNull();
    });

    it("should use OpenAI usage processor for perplexity", () => {
      const processor = getUsageProcessor("perplexity");
      expect(processor?.constructor.name).toBe("OpenAIUsageProcessor");
    });
  });

  describe("Cost Calculations", () => {
    it("should calculate cost correctly for sonar", () => {
      const endpoint = perplexityEndpoints["sonar:perplexity"];
      const breakdown = calculateModelCostBreakdown({
        modelUsage: {
          input: 1000000, // 1M tokens
          output: 1000000, // 1M tokens
        },
        providerModelId: "sonar",
        provider: "perplexity",
        requestCount: 1000, // 1K requests
      });

      // Cost calculation:
      // Input: 1M * $0.000001 = $1.00
      // Output: 1M * $0.000001 = $1.00
      // Requests: 1000 * $0.005 = $5.00
      expect(breakdown.inputCost).toBe(1.0);
      expect(breakdown.outputCost).toBe(1.0);
      expect(breakdown.requestCost).toBe(5.0);
      expect(breakdown.totalCost).toBe(7.0);
    });

    it("should calculate cost correctly for sonar-pro", () => {
      const endpoint = perplexityEndpoints["sonar-pro:perplexity"];
      const breakdown = calculateModelCostBreakdown({
        modelUsage: {
          input: 1000000, // 1M tokens
          output: 1000000, // 1M tokens
        },
        providerModelId: "sonar-pro",
        provider: "perplexity",
        requestCount: 1000, // 1K requests
      });

      // Cost calculation:
      // Input: 1M * $0.000003 = $3.00
      // Output: 1M * $0.000015 = $15.00
      // Requests: 1000 * $0.006 = $6.00
      expect(breakdown.inputCost).toBe(3.0);
      expect(breakdown.outputCost).toBe(15.0);
      expect(breakdown.requestCost).toBe(6.0);
      expect(breakdown.totalCost).toBe(24.0);
    });

    it("should calculate cost with web search", () => {
      const endpoint = perplexityEndpoints["sonar:perplexity"];
      const breakdown = calculateModelCostBreakdown({
        modelUsage: {
          input: 100000, // 100K tokens
          output: 100000, // 100K tokens
          web_search: 100, // 100 searches
        },
        providerModelId: "sonar",
        provider: "perplexity",
        requestCount: 100, // 100 requests
      });

      // Cost calculation:
      // Input: 100K * $0.000001 = $0.10
      // Output: 100K * $0.000001 = $0.10
      // Requests: 100 * $0.005 = $0.50
      // Web search: 100 * $0.005 = $0.50
      expect(breakdown.inputCost).toBe(0.1);
      expect(breakdown.outputCost).toBe(0.1);
      expect(breakdown.requestCost).toBe(0.5);
      expect(breakdown.webSearchCost).toBe(0.5);
      expect(breakdown.totalCost).toBe(1.2);
    });

    it("should handle zero usage", () => {
      const endpoint = perplexityEndpoints["sonar:perplexity"];
      const breakdown = calculateModelCostBreakdown({
        modelUsage: {
          input: 0,
          output: 0,
        },
        providerModelId: "sonar",
        provider: "perplexity",
        requestCount: 0,
      });

      expect(breakdown.totalCost).toBe(0);
    });
  });

  describe("Model Context Lengths", () => {
    it("should match endpoint context lengths to model definitions", () => {
      Object.entries(perplexityEndpoints).forEach(([key, endpoint]: [string, ModelProviderConfig]) => {
        const modelName = key.split(":")[0] as keyof typeof perplexityModels;
        const model = perplexityModels[modelName];
        expect(endpoint.contextLength).toBe(model.contextLength);
      });
    });

    it("should match max completion tokens to model definitions", () => {
      Object.entries(perplexityEndpoints).forEach(([key, endpoint]: [string, ModelProviderConfig]) => {
        const modelName = key.split(":")[0] as keyof typeof perplexityModels;
        const model = perplexityModels[modelName];
        expect(endpoint.maxCompletionTokens).toBe(model.maxOutputTokens);
      });
    });
  });

  describe("Model Consistency", () => {
    it("should have consistent naming between models and endpoints", () => {
      const modelNames = Object.keys(perplexityModels);
      const endpointModelNames = Object.keys(perplexityEndpoints).map(
        (key) => key.split(":")[0]
      );

      modelNames.forEach((modelName) => {
        expect(endpointModelNames).toContain(modelName);
      });
    });

    it("should have descriptions for all models", () => {
      Object.values(perplexityModels).forEach((model: ModelConfig) => {
        expect(model.description).toBeDefined();
        expect(model.description.length).toBeGreaterThan(0);
      });
    });

    it("should have unique names for all models", () => {
      const names = Object.values(perplexityModels).map((m: ModelConfig) => m.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });
});
