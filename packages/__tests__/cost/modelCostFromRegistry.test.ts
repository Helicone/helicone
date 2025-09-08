import type { ModelUsage } from "../../cost/usage/types";
import type { ModelProviderName } from "../../cost/models/providers";
import { modelCostBreakdownFromRegistry } from "../../cost/costCalc";
import { calculateModelCostBreakdown } from "../../cost/models/calculate-cost";

describe("modelCostBreakdownFromRegistry", () => {
  it("should calculate cost for basic GPT-4o usage", () => {
    const modelUsage: ModelUsage = {
      input: 1000,
      output: 500,
    };

    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage,
      model: "gpt-4o",
      provider: "openai" as ModelProviderName,
    });

    expect(breakdown).not.toBeNull();
    if (breakdown) {
      // GPT-4o pricing: $0.0025 per 1K input, $0.01 per 1K output
      // Expected: 1000 * 0.0025/1000 + 500 * 0.01/1000
      // = 0.0025 + 0.005 = 0.0075
      expect(breakdown.totalCost).toBe(0.0075);
    }
  });

  it("should calculate cost for Claude with cache", () => {
    const modelUsage: ModelUsage = {
      input: 1500,  // Regular input tokens (already excludes cached)
      output: 1000,
      cacheDetails: {
        cachedInput: 500,
        write5m: 100,
        write1h: 50,
      },
    };

    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage,
      model: "claude-3.5-sonnet-v2",
      provider: "anthropic" as ModelProviderName,
    });

    expect(breakdown).not.toBeNull();
    if (breakdown) {
      // Claude pricing: $0.003 per 1K input, $0.015 per 1K output
      // Cache multipliers: cachedInput: 0.1, write5m: 1.25, write1h: 2.0
      // Expected calculation:
      // - Regular input: 1500 * 0.003/1000 = 0.0045
      // - Cached input: 500 * 0.003/1000 * 0.1 = 0.00015
      // - Cache write 5m: 100 * 0.003/1000 * 1.25 = 0.000375
      // - Cache write 1h: 50 * 0.003/1000 * 2.0 = 0.0003
      // - Output: 1000 * 0.015/1000 = 0.015
      // Total: 0.0045 + 0.00015 + 0.000375 + 0.0003 + 0.015 = 0.020325
      expect(breakdown.totalCost).toBeCloseTo(0.020325, 10);
    }
  });

  it("should return null for non-existent model", () => {
    const modelUsage: ModelUsage = {
      input: 100,
      output: 50,
    };

    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage,
      model: "non-existent-model",
      provider: "unknown" as ModelProviderName,
    });

    expect(breakdown).toBeNull();
  });

  it("should return 0 for empty usage", () => {
    const modelUsage: ModelUsage = {
      input: 0,
      output: 0,
    };

    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage,
      model: "gpt-4o",
      provider: "openai" as ModelProviderName,
    });

    expect(breakdown).not.toBeNull();
    if (breakdown) {
      expect(breakdown.totalCost).toBe(0);
    }
  });

  it("should calculate cost breakdown correctly", () => {
    const modelUsage: ModelUsage = {
      input: 800,  // Regular input tokens (already excludes cached)
      output: 500,
      cacheDetails: {
        cachedInput: 200,
      },
    };

    const breakdown = calculateModelCostBreakdown({
      modelUsage,
      model: "gpt-4o",
      provider: "openai" as ModelProviderName,
    });

    expect(breakdown).not.toBeNull();
    if (breakdown) {
      // GPT-4o pricing: $0.0025 per 1K input, $0.01 per 1K output
      // Cache multiplier for cached input: 0.5
      expect(breakdown.inputCost).toBe(800 * 0.0025 / 1000);
      expect(breakdown.cachedInputCost).toBe(200 * 0.0025 / 1000 * 0.5);
      expect(breakdown.outputCost).toBe(500 * 0.01 / 1000);
      expect(breakdown.totalCost).toBe(breakdown.inputCost + breakdown.cachedInputCost + breakdown.outputCost);
    }
  });

  it("should handle audio tokens for Gemini", () => {
    const modelUsage: ModelUsage = {
      input: 1000,
      output: 500,
      audio: 200,
    };

    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage,
      model: "gemini-2.5-flash",
      provider: "google-ai-studio" as ModelProviderName,
    });

    expect(breakdown).not.toBeNull();
    if (breakdown) {
      // Gemini pricing includes specific audio pricing
      expect(breakdown.audioCost).toBeGreaterThan(0);
      expect(breakdown.totalCost).toBeGreaterThan(0);
    }
  });

  it("should handle web search for Grok", () => {
    const modelUsage: ModelUsage = {
      input: 1000,
      output: 500,
      web_search: 5,
    };

    // First check the standard grok model with xai provider
    const breakdown = calculateModelCostBreakdown({
      modelUsage,
      model: "grok-3",
      provider: "xai" as ModelProviderName,
    });

    expect(breakdown).not.toBeNull();
    if (breakdown) {
      expect(breakdown.webSearchCost).toBe(5 * 0.025);
    }
  });

  it("should handle images for Gemini", () => {
    const modelUsage: ModelUsage = {
      input: 500,
      output: 200,
      image: 3,
    };

    const breakdown = calculateModelCostBreakdown({
      modelUsage,
      model: "gemini-2.5-flash",
      provider: "vertex" as ModelProviderName,
    });

    expect(breakdown).not.toBeNull();
    if (breakdown) {
      // Gemini image price: $0.001238 per image
      expect(breakdown.imageCost).toBe(3 * 0.001238);
    }
  });
});