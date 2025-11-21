import { describe, it, expect } from "@jest/globals";
import {
  canopywaveModels,
  canopywaveEndpointConfig as canopywaveEndpoints,
} from "../../cost/models/authors/canopywave";
import { getUsageProcessor } from "../../cost/usage/getUsageProcessor";
import { calculateModelCostBreakdown } from "../../cost/models/calculate-cost";
import type { ModelConfig, ModelProviderConfig } from "../../cost/models/types";

describe("CanopyWave Model Registry", () => {
  describe("Model Definitions", () => {
    it("should define all CanopyWave models", () => {
      const modelNames = Object.keys(canopywaveModels);
      expect(modelNames).toHaveLength(1);
      expect(modelNames).toContain("kimi-k2-thinking");
    });

    it("should have correct author for all models", () => {
      Object.values(canopywaveModels).forEach((model) => {
        expect((model as ModelConfig).author).toBe("canopywave");
      });
    });

    it("should have MoonshotAI tokenizer for all models", () => {
      Object.values(canopywaveModels).forEach((model) => {
        expect((model as ModelConfig).tokenizer).toBe("MoonshotAI");
      });
    });

    it("should have text input/output modality", () => {
      Object.values(canopywaveModels).forEach((model) => {
        expect((model as ModelConfig).modality.inputs).toContain("text");
        expect((model as ModelConfig).modality.outputs).toContain("text");
      });
    });

    it("should have correct context length for kimi-k2-thinking", () => {
      expect(canopywaveModels["kimi-k2-thinking"].contextLength).toBe(256_000);
    });

    it("should have correct max output tokens for kimi-k2-thinking", () => {
      expect(canopywaveModels["kimi-k2-thinking"].maxOutputTokens).toBe(
        262_144
      );
    });
  });

  describe("Endpoint Configurations", () => {
    it("should define endpoints for all models", () => {
      const endpointKeys = Object.keys(canopywaveEndpoints);
      expect(endpointKeys).toHaveLength(1);
      expect(endpointKeys).toContain("kimi-k2-thinking:canopywave");
    });

    it("should have PTB enabled for all endpoints", () => {
      Object.values(canopywaveEndpoints).forEach((endpoint) => {
        expect((endpoint as ModelProviderConfig).ptbEnabled).toBe(true);
      });
    });

    it("should have canopywave provider for all endpoints", () => {
      Object.values(canopywaveEndpoints).forEach((endpoint) => {
        expect((endpoint as ModelProviderConfig).provider).toBe("canopywave");
        expect((endpoint as ModelProviderConfig).author).toBe("canopywave");
      });
    });

    it("should have correct model ID", () => {
      expect(
        canopywaveEndpoints["kimi-k2-thinking:canopywave"].providerModelId
      ).toBe("kimi-k2-thinking");
    });

    it("should have wildcard endpoint config", () => {
      Object.values(canopywaveEndpoints).forEach((endpoint) => {
        expect((endpoint as ModelProviderConfig).endpointConfigs).toHaveProperty(
          "*"
        );
      });
    });

    it("should support standard parameters", () => {
      const standardParams = [
        "max_tokens",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
        "tools",
        "tool_choice",
        "response_format",
      ];

      Object.values(canopywaveEndpoints).forEach((endpoint) => {
        standardParams.forEach((param) => {
          expect(
            (endpoint as ModelProviderConfig).supportedParameters
          ).toContain(param);
        });
      });
    });
  });

  describe("Pricing Configuration", () => {
    it("should have pricing defined for all endpoints", () => {
      Object.values(canopywaveEndpoints).forEach((endpoint) => {
        const ep = endpoint as ModelProviderConfig;
        expect(ep.pricing).toBeDefined();
        expect(ep.pricing.length).toBeGreaterThan(0);
      });
    });

    it("should have correct pricing structure", () => {
      Object.values(canopywaveEndpoints).forEach((endpoint) => {
        const ep = endpoint as ModelProviderConfig;
        const pricing = ep.pricing[0];
        expect(pricing.threshold).toBe(0);
        expect(pricing.input).toBeGreaterThan(0);
        expect(pricing.output).toBeGreaterThan(0);
      });
    });

    it("should have correct kimi-k2-thinking pricing", () => {
      const pricing =
        canopywaveEndpoints["kimi-k2-thinking:canopywave"].pricing[0];
      expect(pricing.input).toBe(0.00000048); // $0.48 per 1M tokens
      expect(pricing.output).toBe(0.000002); // $2.00 per 1M tokens
      expect(pricing.request).toBe(0.0);
      expect(pricing.web_search).toBe(0.0);
    });

    it("should have zero cost for audio and image", () => {
      Object.values(canopywaveEndpoints).forEach((endpoint) => {
        const ep = endpoint as ModelProviderConfig;
        const pricing = ep.pricing[0];
        expect(pricing.audio).toBe(0);
        expect(pricing.image).toBe(0);
      });
    });
  });

  describe("Usage Processor", () => {
    it("should have usage processor defined for canopywave provider", () => {
      const processor = getUsageProcessor("canopywave");
      expect(processor).toBeDefined();
      expect(processor).not.toBeNull();
    });

    it("should use OpenAI usage processor for canopywave", () => {
      const processor = getUsageProcessor("canopywave");
      expect(processor?.constructor.name).toBe("OpenAIUsageProcessor");
    });
  });

  describe("Cost Calculations", () => {
    it("should calculate cost correctly for kimi-k2-thinking", () => {
      const endpoint = canopywaveEndpoints["kimi-k2-thinking:canopywave"];
      const breakdown = calculateModelCostBreakdown({
        modelUsage: {
          input: 1000000, // 1M tokens
          output: 1000000, // 1M tokens
        },
        providerModelId: "kimi-k2-thinking",
        provider: "canopywave",
        requestCount: 0,
      });

      // Cost calculation:
      // Input: 1M * $0.00000048 = $0.48
      // Output: 1M * $0.000002 = $2.00
      expect(breakdown).toBeDefined();
      expect(breakdown?.inputCost).toBeCloseTo(0.48, 10);
      expect(breakdown?.outputCost).toBeCloseTo(2.0, 10);
      expect(breakdown?.requestCost).toBe(0);
      expect(breakdown?.totalCost).toBeCloseTo(2.48, 10);
    });

    it("should calculate cost correctly for different token counts", () => {
      const endpoint = canopywaveEndpoints["kimi-k2-thinking:canopywave"];
      const breakdown = calculateModelCostBreakdown({
        modelUsage: {
          input: 500000, // 500K tokens
          output: 250000, // 250K tokens
        },
        providerModelId: "kimi-k2-thinking",
        provider: "canopywave",
        requestCount: 0,
      });

      // Cost calculation:
      // Input: 500K * $0.00000048 = $0.24
      // Output: 250K * $0.000002 = $0.50
      expect(breakdown).toBeDefined();
      expect(breakdown?.inputCost).toBeCloseTo(0.24, 10);
      expect(breakdown?.outputCost).toBeCloseTo(0.5, 10);
      expect(breakdown?.totalCost).toBeCloseTo(0.74, 10);
    });

    it("should handle zero usage", () => {
      const endpoint = canopywaveEndpoints["kimi-k2-thinking:canopywave"];
      const breakdown = calculateModelCostBreakdown({
        modelUsage: {
          input: 0,
          output: 0,
        },
        providerModelId: "kimi-k2-thinking",
        provider: "canopywave",
        requestCount: 0,
      });

      expect(breakdown).toBeDefined();
      expect(breakdown?.totalCost).toBe(0);
    });
  });

  describe("Model Context Lengths", () => {
    it("should match endpoint context lengths to model definitions", () => {
      Object.entries(canopywaveEndpoints).forEach(([key, endpoint]) => {
        const ep = endpoint as ModelProviderConfig;
        const modelName = key.split(":")[0] as keyof typeof canopywaveModels;
        const model = canopywaveModels[modelName];
        expect(ep.contextLength).toBe(model.contextLength);
      });
    });

    it("should match max completion tokens to model definitions", () => {
      Object.entries(canopywaveEndpoints).forEach(([key, endpoint]) => {
        const ep = endpoint as ModelProviderConfig;
        const modelName = key.split(":")[0] as keyof typeof canopywaveModels;
        const model = canopywaveModels[modelName];
        expect(ep.maxCompletionTokens).toBe(model.maxOutputTokens);
      });
    });
  });

  describe("Model Consistency", () => {
    it("should have consistent naming between models and endpoints", () => {
      const modelNames = Object.keys(canopywaveModels);
      const endpointModelNames = Object.keys(canopywaveEndpoints).map((key) =>
        key.split(":")[0]
      );

      modelNames.forEach((modelName) => {
        expect(endpointModelNames).toContain(modelName);
      });
    });

    it("should have descriptions for all models", () => {
      Object.values(canopywaveModels).forEach((model) => {
        const m = model as ModelConfig;
        expect(m.description).toBeDefined();
        expect(m.description.length).toBeGreaterThan(0);
      });
    });

    it("should have unique names for all models", () => {
      const names = Object.values(canopywaveModels).map(
        (m) => (m as ModelConfig).name
      );
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });
});
