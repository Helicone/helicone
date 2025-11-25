import type { ModelUsage } from "../../cost/usage/types";
import type { ModelProviderName } from "../../cost/models/providers";
import { modelCostBreakdownFromRegistry } from "../../cost/costCalc";

describe("modelCostBreakdownFromRegistry", () => {
  it("should calculate cost for basic GPT-4o usage", () => {
    const modelUsage: ModelUsage = {
      input: 1000,
      output: 500,
    };

    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage,
      providerModelId: "gpt-4o",
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
      input: 1500,
      output: 1000,
      cacheDetails: {
        cachedInput: 500,
        write5m: 100,
        write1h: 50,
      },
    };

    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage,
      providerModelId: "claude-3-5-sonnet-20241022",
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
      providerModelId: "non-existent-model",
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
      providerModelId: "gpt-4o",
      provider: "openai" as ModelProviderName,
    });

    expect(breakdown).not.toBeNull();
    if (breakdown) {
      expect(breakdown.totalCost).toBe(0);
    }
  });

  it("should calculate cost breakdown correctly", () => {
    const modelUsage: ModelUsage = {
      input: 800,
      output: 500,
      cacheDetails: {
        cachedInput: 200,
      },
    };

    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage,
      providerModelId: "gpt-4o",
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
      providerModelId: "gemini-2.5-flash",
      provider: "google-ai-studio" as ModelProviderName,
    });

    expect(breakdown).not.toBeNull();
    if (breakdown) {
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

    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage,
      providerModelId: "grok-3",
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

    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage,
      providerModelId: "gemini-2.5-flash",
      provider: "vertex" as ModelProviderName,
    });

    expect(breakdown).not.toBeNull();
    if (breakdown) {
      // Gemini image price: $0.001238 per image
      expect(breakdown.imageCost).toBe(3 * 0.001238);
    }
  });

  describe("threshold-based pricing", () => {
    it("should use base tier pricing for Claude Sonnet 4 under 200K tokens", () => {
      const modelUsage: ModelUsage = {
        input: 100000, // 100K tokens - under threshold
        output: 50000,
        cacheDetails: {
          cachedInput: 10000,
        },
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "claude-sonnet-4-20250514",
        provider: "anthropic" as ModelProviderName,
      });

      expect(breakdown).not.toBeNull();
      if (breakdown) {
        // Base tier: $3/M input, $15/M output
        expect(breakdown.inputCost).toBe(100000 * 0.000003);
        expect(breakdown.outputCost).toBe(50000 * 0.000015);
        expect(breakdown.cachedInputCost).toBe(10000 * 0.000003 * 0.1);
        expect(breakdown.totalCost).toBe(
          breakdown.inputCost + breakdown.outputCost + breakdown.cachedInputCost
        );
      }
    });

    it("should use higher tier pricing for Claude Sonnet 4 over 200K tokens", () => {
      const modelUsage: ModelUsage = {
        input: 250000, // 250K tokens - over 200K threshold
        output: 50000,
        cacheDetails: {
          cachedInput: 10000,
          write5m: 5000,
        },
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "claude-sonnet-4-20250514",
        provider: "anthropic" as ModelProviderName,
      });

      expect(breakdown).not.toBeNull();
      if (breakdown) {
        // Higher tier: $6/M input, $22.50/M output (multipliers inherited from base tier)
        expect(breakdown.inputCost).toBe(250000 * 0.000006);
        expect(breakdown.outputCost).toBe(50000 * 0.0000225);
        expect(breakdown.cachedInputCost).toBe(10000 * 0.000003 * 0.1);
        expect(breakdown.cacheWrite5mCost).toBe(5000 * 0.000003 * 1.25);
      }
    });

    it("should use base tier pricing for Gemini 3 Pro Preview under 200K tokens", () => {
      const modelUsage: ModelUsage = {
        input: 150000, // 150K tokens - under threshold
        output: 30000,
        cacheDetails: {
          cachedInput: 20000,
        },
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "gemini-3-pro-preview",
        provider: "google-ai-studio" as ModelProviderName,
      });

      expect(breakdown).not.toBeNull();
      if (breakdown) {
        // Base tier: $2/M input, $12/M output, cachedInput multiplier 0.1
        expect(breakdown.inputCost).toBe(150000 * 0.000002);
        expect(breakdown.outputCost).toBe(30000 * 0.000012);
        expect(breakdown.cachedInputCost).toBe(20000 * 0.000002 * 0.1);
      }
    });

    it("should use higher tier pricing for Gemini 3 Pro Preview over 200K tokens", () => {
      const modelUsage: ModelUsage = {
        input: 300000, // 300K tokens - over 200K threshold
        output: 50000,
        cacheDetails: {
          cachedInput: 25000,
        },
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "gemini-3-pro-preview",
        provider: "google-ai-studio" as ModelProviderName,
      });

      expect(breakdown).not.toBeNull();
      if (breakdown) {
        // Higher tier: $4/M input, $18/M output, cachedInput multiplier 0.2222222
        // Total prompt = input + cachedInput = 325000 (over threshold)
        expect(breakdown.inputCost).toBe(300000 * 0.000004);
        expect(breakdown.outputCost).toBe(50000 * 0.000018);
        expect(breakdown.cachedInputCost).toBe(25000 * 0.000004 * 0.1);
      }
    });

    it("should inherit optional fields from base tier in higher tiers", () => {
      const modelUsage: ModelUsage = {
        input: 250000, // Over 200K threshold
        output: 30000,
        web_search: 10, // This should use inherited web_search pricing
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "claude-sonnet-4-20250514",
        provider: "anthropic" as ModelProviderName,
      });

      expect(breakdown).not.toBeNull();
      if (breakdown) {
        // web_search is not defined in tier 2, should inherit from tier 0: $10 per 1000 searches
        expect(breakdown.webSearchCost).toBe(10 * 0.01);
      }
    });

    it("should handle exact threshold boundary correctly", () => {
      const modelUsage: ModelUsage = {
        input: 200000, // Exactly at threshold
        output: 10000,
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "claude-sonnet-4-20250514",
        provider: "anthropic" as ModelProviderName,
      });

      expect(breakdown).not.toBeNull();
      if (breakdown) {
        // At exactly 200000, should use higher tier: $6/M input, $22.50/M output
        expect(breakdown.inputCost).toBe(200000 * 0.000006);
        expect(breakdown.outputCost).toBe(10000 * 0.0000225);
      }
    });

    it("should handle Vertex Gemini 3 Pro with threshold pricing", () => {
      const modelUsage: ModelUsage = {
        input: 250000, // Over 200K threshold
        output: 40000,
        cacheDetails: {
          cachedInput: 30000,
        },
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: "gemini-3-pro-preview",
        provider: "vertex" as ModelProviderName,
      });

      // Vertex calculates the threshold for cached input by just the cached tokens
      // and so it is NOT over the threshold, but input and output is.
      expect(breakdown).not.toBeNull();
      if (breakdown) {
        expect(breakdown.inputCost).toBe(250000 * 0.000004);
        expect(breakdown.outputCost).toBe(40000 * 0.000018);
        expect(breakdown.cachedInputCost).toBe(30000 * 0.000002 * 0.1);
      }
    });
  });
});