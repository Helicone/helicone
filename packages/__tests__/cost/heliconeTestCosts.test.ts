import type { ModelUsage } from "../../cost/usage/types";
import type { ModelProviderName } from "../../cost/models/providers";
import { modelCostBreakdownFromRegistry } from "../../cost/costCalc";
import { describe, it, expect } from "@jest/globals";

describe("Helicone Test Model - Cost Calculations", () => {
  describe("Free Model (Zero Cost)", () => {
    it("should calculate zero cost for free model", () => {
      const modelUsage: ModelUsage = {
        input: 1000,
        output: 500,
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "helicone-test-free",
        provider: "openai" as ModelProviderName,
      });

      expect(breakdown).not.toBeNull();
      expect(breakdown?.totalCost).toBe(0);
      expect(breakdown?.inputCost).toBe(0);
      expect(breakdown?.outputCost).toBe(0);
    });

    it("should handle large token counts with zero cost", () => {
      const modelUsage: ModelUsage = {
        input: 1000000,
        output: 1000000,
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "helicone-test-free",
        provider: "openai" as ModelProviderName,
      });

      expect(breakdown).not.toBeNull();
      expect(breakdown?.totalCost).toBe(0);
    });

    it("should handle zero usage", () => {
      const modelUsage: ModelUsage = {
        input: 0,
        output: 0,
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "helicone-test-free",
        provider: "openai" as ModelProviderName,
      });

      expect(breakdown).not.toBeNull();
      expect(breakdown?.totalCost).toBe(0);
    });
  });

  describe("Cheap Model (Low Cost)", () => {
    it("should calculate correct low cost", () => {
      const modelUsage: ModelUsage = {
        input: 1000,
        output: 500,
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "helicone-test-cheap",
        provider: "openai" as ModelProviderName,
      });

      expect(breakdown).not.toBeNull();
      if (breakdown) {
        // Pricing: $0.0001 per 1K input, $0.0002 per 1K output
        // Expected: (1000 * 0.0001/1000) + (500 * 0.0002/1000)
        // = 0.0001 + 0.0001 = 0.0002
        expect(breakdown.inputCost).toBe(1000 * 0.0000001);
        expect(breakdown.outputCost).toBe(500 * 0.0000002);
        expect(breakdown.totalCost).toBe(breakdown.inputCost + breakdown.outputCost);
      }
    });

    it("should calculate cost for 1M tokens", () => {
      const modelUsage: ModelUsage = {
        input: 1000000,
        output: 500000,
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "helicone-test-cheap",
        provider: "openai" as ModelProviderName,
      });

      expect(breakdown).not.toBeNull();
      if (breakdown) {
        // Pricing: $0.0000001 per token = $0.0001 per 1K tokens
        // 1M tokens × $0.0000001 = $0.1 input
        // 500K tokens × $0.0000002 = $0.1 output
        // Total = $0.2
        expect(breakdown.inputCost).toBeCloseTo(0.1, 2);
        expect(breakdown.outputCost).toBeCloseTo(0.1, 2);
        expect(breakdown.totalCost).toBeCloseTo(0.2, 2);
      }
    });

    it("should handle small token counts", () => {
      const modelUsage: ModelUsage = {
        input: 10,
        output: 5,
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "helicone-test-cheap",
        provider: "openai" as ModelProviderName,
      });

      expect(breakdown).not.toBeNull();
      expect(breakdown?.totalCost).toBeGreaterThan(0);
      expect(breakdown?.totalCost).toBeLessThan(0.01);
    });
  });

  describe("Expensive Model (High Cost)", () => {
    it("should calculate correct high cost", () => {
      const modelUsage: ModelUsage = {
        input: 1000,
        output: 500,
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "helicone-test-expensive",
        provider: "openai" as ModelProviderName,
      });

      expect(breakdown).not.toBeNull();
      if (breakdown) {
        // Pricing: $0.01 per 1K input, $0.02 per 1K output
        // Expected: (1000 * 0.01/1000) + (500 * 0.02/1000)
        // = 0.01 + 0.01 = 0.02
        expect(breakdown.inputCost).toBe(1000 * 0.00001);
        expect(breakdown.outputCost).toBe(500 * 0.00002);
        expect(breakdown.totalCost).toBe(breakdown.inputCost + breakdown.outputCost);
      }
    });

    it("should calculate cost for 100K tokens", () => {
      const modelUsage: ModelUsage = {
        input: 100000,
        output: 50000,
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "helicone-test-expensive",
        provider: "openai" as ModelProviderName,
      });

      expect(breakdown).not.toBeNull();
      if (breakdown) {
        // Pricing: $0.00001 per token = $10 per 1M tokens
        // 100K tokens × $0.00001 = $1 input
        // 50K tokens × $0.00002 = $1 output
        // Total = $2
        expect(breakdown.inputCost).toBeCloseTo(1, 2);
        expect(breakdown.outputCost).toBeCloseTo(1, 2);
        expect(breakdown.totalCost).toBeCloseTo(2, 2);
      }
    });

    it("should handle large usage numbers", () => {
      const modelUsage: ModelUsage = {
        input: 10000000,
        output: 10000000,
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "helicone-test-expensive",
        provider: "openai" as ModelProviderName,
      });

      expect(breakdown).not.toBeNull();
      if (breakdown) {
        // Pricing: $0.00001 per token
        // 10M × $0.00001 + 10M × $0.00002 = $100 + $200 = $300
        expect(breakdown.totalCost).toBeCloseTo(300, 2);
      }
    });
  });

  describe("Comparative Costs", () => {
    it("should have different costs for same usage across models", () => {
      const modelUsage: ModelUsage = {
        input: 10000,
        output: 5000,
      };

      const freeCost = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "helicone-test-free",
        provider: "openai" as ModelProviderName,
      });

      const cheapCost = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "helicone-test-cheap",
        provider: "openai" as ModelProviderName,
      });

      const expensiveCost = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "helicone-test-expensive",
        provider: "openai" as ModelProviderName,
      });

      expect(freeCost?.totalCost).toBe(0);
      expect(cheapCost?.totalCost).toBeGreaterThan(0);
      expect(expensiveCost?.totalCost).toBeGreaterThan(cheapCost?.totalCost ?? 0);
    });

    it("should scale costs correctly", () => {
      const smallUsage: ModelUsage = { input: 1000, output: 500 };
      const largeUsage: ModelUsage = { input: 10000, output: 5000 };

      const smallCost = modelCostBreakdownFromRegistry({
        modelUsage: smallUsage,
        providerModelId: "helicone-test-cheap",
        provider: "openai" as ModelProviderName,
      });

      const largeCost = modelCostBreakdownFromRegistry({
        modelUsage: largeUsage,
        providerModelId: "helicone-test-cheap",
        provider: "openai" as ModelProviderName,
      });

      // Large usage should cost 10x more
      expect(largeCost?.totalCost).toBeCloseTo((smallCost?.totalCost ?? 0) * 10, 10);
    });
  });

  describe("Edge Cases", () => {
    it("should handle input-only usage", () => {
      const modelUsage: ModelUsage = {
        input: 1000,
        output: 0,
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "helicone-test-cheap",
        provider: "openai" as ModelProviderName,
      });

      expect(breakdown).not.toBeNull();
      expect(breakdown?.outputCost).toBe(0);
      expect(breakdown?.inputCost).toBeGreaterThan(0);
    });

    it("should handle output-only usage", () => {
      const modelUsage: ModelUsage = {
        input: 0,
        output: 1000,
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "helicone-test-expensive",
        provider: "openai" as ModelProviderName,
      });

      expect(breakdown).not.toBeNull();
      expect(breakdown?.inputCost).toBe(0);
      expect(breakdown?.outputCost).toBeGreaterThan(0);
    });

    it("should return cost breakdown structure", () => {
      const modelUsage: ModelUsage = {
        input: 100,
        output: 50,
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "helicone-test-cheap",
        provider: "openai" as ModelProviderName,
      });

      expect(breakdown).not.toBeNull();
      expect(breakdown).toHaveProperty("inputCost");
      expect(breakdown).toHaveProperty("outputCost");
      expect(breakdown).toHaveProperty("totalCost");
      expect(typeof breakdown?.inputCost).toBe("number");
      expect(typeof breakdown?.outputCost).toBe("number");
      expect(typeof breakdown?.totalCost).toBe("number");
    });
  });
});
