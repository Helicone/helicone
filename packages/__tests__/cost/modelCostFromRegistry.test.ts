import type { ModelUsage } from "../../cost/usage/types";
import type { ModelProviderName } from "../../cost/models/providers";
import { modelCost, modelCostBreakdownFromRegistry } from "../../cost/costCalc";

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
      audio: {
        input: 200,
        output: 0,
      },
    };

    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage,
      providerModelId: "gemini-2.5-flash",
      provider: "google-ai-studio" as ModelProviderName,
    });

    expect(breakdown).not.toBeNull();
    if (breakdown) {
      expect(breakdown.audio).toBeDefined();
      expect(breakdown.audio!.inputCost).toBeGreaterThan(0);
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
      image: {
        input: 3,
        output: 0,
      },
    };

    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage,
      providerModelId: "gemini-2.5-flash",
      provider: "vertex" as ModelProviderName,
    });

    expect(breakdown).not.toBeNull();
    if (breakdown) {
      // Image modality cost should be calculated with fallback to text rates
      expect(breakdown.image).toBeDefined();
      // Input cost calculated using fallback to text input rate since no image-specific pricing
      expect(breakdown.image!.inputCost).toBeGreaterThanOrEqual(0);
    }
  });

  it("should calculate correct image output pricing for Gemini 3 Pro Image", () => {
    // Simulate a 1K/2K image generation (1120 tokens per Google's pricing docs)
    const modelUsage: ModelUsage = {
      input: 100, // text prompt tokens
      output: 50, // text output tokens
      image: {
        input: 0,
        output: 1120, // 1K/2K image = 1120 tokens
      },
    };

    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage,
      providerModelId: "gemini-3-pro-image-preview",
      provider: "google-ai-studio" as ModelProviderName,
    });

    expect(breakdown).not.toBeNull();
    if (breakdown) {
      // Text pricing: $2/1M input, $12/1M output
      expect(breakdown.inputCost).toBeCloseTo(100 * 0.000002, 10);
      expect(breakdown.outputCost).toBeCloseTo(50 * 0.000012, 10);

      // Image output pricing: $120/1M tokens = $0.00012/token
      // 1120 tokens * $0.00012 = $0.1344 (matches Google's $0.134 per 1K/2K image)
      expect(breakdown.image).toBeDefined();
      expect(breakdown.image!.outputCost).toBeCloseTo(1120 * 0.00012, 10);
      expect(breakdown.image!.outputCost).toBeCloseTo(0.1344, 4);

      // Total should include text + image costs
      const expectedTotal =
        breakdown.inputCost + breakdown.outputCost + breakdown.image!.outputCost;
      expect(breakdown.totalCost).toBeCloseTo(expectedTotal, 10);
    }
  });

  it("should calculate correct image output pricing for Gemini 3 Pro Image on Vertex", () => {
    const modelUsage: ModelUsage = {
      input: 100,
      output: 50,
      image: {
        input: 0,
        output: 1120, // 1K/2K image
      },
    };

    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage,
      providerModelId: "gemini-3-pro-image-preview",
      provider: "vertex" as ModelProviderName,
    });

    expect(breakdown).not.toBeNull();
    if (breakdown) {
      // Image output pricing should be $120/1M = $0.00012/token
      expect(breakdown.image).toBeDefined();
      expect(breakdown.image!.outputCost).toBeCloseTo(0.1344, 4);
    }
  });

  it("should calculate correct image output pricing for Gemini 3 Pro Image on OpenRouter", () => {
    const modelUsage: ModelUsage = {
      input: 100,
      output: 50,
      image: {
        input: 0,
        output: 1120, // 1K/2K image
      },
    };

    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage,
      providerModelId: "google/gemini-3-pro-image-preview",
      provider: "openrouter" as ModelProviderName,
    });

    expect(breakdown).not.toBeNull();
    if (breakdown) {
      // OpenRouter has 5.5% markup: $126.60/1M = $0.0001266/token
      // 1120 * $0.0001266 = $0.141792
      expect(breakdown.image).toBeDefined();
      expect(breakdown.image!.outputCost).toBeCloseTo(1120 * 0.0001266, 4);
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

describe("unpriced model warning", () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  const legacyUsage = {
    sum_prompt_tokens: 100,
    prompt_cache_write_tokens: 0,
    prompt_cache_read_tokens: 0,
    prompt_audio_tokens: 0,
    sum_completion_tokens: 50,
    completion_audio_tokens: 0,
    prompt_cache_write_5m: 0,
    prompt_cache_write_1h: 0,
  };

  it("registry path warns with provider and model when no pricing exists", () => {
    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage: { input: 100, output: 50 },
      providerModelId: "not-a-real-model",
      provider: "anthropic" as ModelProviderName,
    });

    expect(breakdown).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = String(warnSpy.mock.calls[0][0]);
    expect(message).toContain("not-a-real-model");
    expect(message).toContain("anthropic");
  });

  it("registry path does not warn when pricing exists", () => {
    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage: { input: 100, output: 50 },
      providerModelId: "gpt-4o",
      provider: "openai" as ModelProviderName,
    });

    expect(breakdown).not.toBeNull();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("legacy modelCost warns and returns 0 when neither the legacy table nor the registry has pricing", () => {
    const cost = modelCost({
      provider: "ANTHROPIC",
      model: "not-a-real-model",
      ...legacyUsage,
    });

    expect(cost).toBe(0);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = String(warnSpy.mock.calls[0][0]);
    expect(message).toContain("not-a-real-model");
    expect(message).toContain("ANTHROPIC");
  });

  it("legacy modelCost does not warn for a model the registry prices", () => {
    // gpt-5.4 has a registry entry but no row in the legacy openai table.
    // Callers prefer the registry result, so a legacy miss here is not a silent zero.
    const cost = modelCost({
      provider: "OPENAI",
      model: "gpt-5.4",
      ...legacyUsage,
    });

    expect(cost).toBe(0);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("legacy modelCost does not warn when the legacy table has pricing", () => {
    const cost = modelCost({
      provider: "ANTHROPIC",
      model: "claude-sonnet-4-6",
      ...legacyUsage,
      sum_prompt_tokens: 1_000_000,
      sum_completion_tokens: 0,
    });

    expect(cost).toBeCloseTo(3, 10);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe("Claude Opus 4.7 / 4.8 / 5, Sonnet 5, Fable 5 / 5.1 pricing (anthropic)", () => {
  // Rates per https://platform.claude.com/docs/en/about-claude/pricing (per MTok):
  //   Opus 4.7 / 4.8 / 5: $5 in | $6.25 5m write | $10 1h write | $0.50 cache read | $25 out
  //   Sonnet 5:           $2 in | $2.50 5m write | $4 1h write  | $0.20 cache read | $10 out
  //   Fable 5:            $10 in | $12.50 5m write | $20 1h write | $1 cache read | $50 out
  //   Fable 5.1:          $10 in | $12.50 5m write | $20 1h write | $0.25 cache read (0.025x) | $50 out

  const oneMillionOfEverything: ModelUsage = {
    input: 1_000_000,
    output: 1_000_000,
    cacheDetails: {
      cachedInput: 1_000_000,
      write5m: 1_000_000,
      write1h: 1_000_000,
    },
  };

  it("prices the pricing page worked example (50,000 in + 15,000 out at $5/$25) at $0.625 on Opus 4.7, 4.8 and 5", () => {
    for (const providerModelId of ["claude-opus-4-7", "claude-opus-4-8", "claude-opus-5"]) {
      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage: { input: 50_000, output: 15_000 },
        providerModelId,
        provider: "anthropic" as ModelProviderName,
      });

      expect(breakdown).not.toBeNull();
      expect(breakdown!.inputCost).toBeCloseTo(0.25, 10);
      expect(breakdown!.outputCost).toBeCloseTo(0.375, 10);
      expect(breakdown!.totalCost).toBeCloseTo(0.625, 10);
    }
  });

  it("applies $6.25 / $10 / $0.50 cache rates on Opus 4.8", () => {
    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage: oneMillionOfEverything,
      providerModelId: "claude-opus-4-8",
      provider: "anthropic" as ModelProviderName,
    });

    expect(breakdown).not.toBeNull();
    expect(breakdown!.inputCost).toBeCloseTo(5, 10);
    expect(breakdown!.outputCost).toBeCloseTo(25, 10);
    expect(breakdown!.cacheWrite5mCost).toBeCloseTo(6.25, 10);
    expect(breakdown!.cacheWrite1hCost).toBeCloseTo(10, 10);
    expect(breakdown!.cachedInputCost).toBeCloseTo(0.5, 10);
  });

  it("prices Sonnet 5 at $2 / $10 with $2.50 / $4 / $0.20 cache rates", () => {
    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage: oneMillionOfEverything,
      providerModelId: "claude-sonnet-5",
      provider: "anthropic" as ModelProviderName,
    });

    expect(breakdown).not.toBeNull();
    expect(breakdown!.inputCost).toBeCloseTo(2, 10);
    expect(breakdown!.outputCost).toBeCloseTo(10, 10);
    expect(breakdown!.cacheWrite5mCost).toBeCloseTo(2.5, 10);
    expect(breakdown!.cacheWrite1hCost).toBeCloseTo(4, 10);
    expect(breakdown!.cachedInputCost).toBeCloseTo(0.2, 10);
  });

  it("prices Fable 5 at $10 / $50 with a $1 cache read (0.1x)", () => {
    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage: oneMillionOfEverything,
      providerModelId: "claude-fable-5",
      provider: "anthropic" as ModelProviderName,
    });

    expect(breakdown).not.toBeNull();
    expect(breakdown!.inputCost).toBeCloseTo(10, 10);
    expect(breakdown!.outputCost).toBeCloseTo(50, 10);
    expect(breakdown!.cacheWrite5mCost).toBeCloseTo(12.5, 10);
    expect(breakdown!.cacheWrite1hCost).toBeCloseTo(20, 10);
    expect(breakdown!.cachedInputCost).toBeCloseTo(1, 10);
  });

  it("prices Fable 5.1 cache reads at $0.25 per MTok (0.025x), not the 0.1x default", () => {
    const breakdown = modelCostBreakdownFromRegistry({
      modelUsage: oneMillionOfEverything,
      providerModelId: "claude-fable-5-1",
      provider: "anthropic" as ModelProviderName,
    });

    expect(breakdown).not.toBeNull();
    expect(breakdown!.inputCost).toBeCloseTo(10, 10);
    expect(breakdown!.outputCost).toBeCloseTo(50, 10);
    expect(breakdown!.cacheWrite5mCost).toBeCloseTo(12.5, 10);
    expect(breakdown!.cacheWrite1hCost).toBeCloseTo(20, 10);
    expect(breakdown!.cachedInputCost).toBeCloseTo(0.25, 10);
  });

  it("legacy table prices claude-opus-4-8 and the Fable 5.1 cache rates as well", () => {
    const opus = modelCost({
      provider: "ANTHROPIC",
      model: "claude-opus-4-8",
      sum_prompt_tokens: 50_000,
      prompt_cache_write_tokens: 0,
      prompt_cache_read_tokens: 0,
      prompt_audio_tokens: 0,
      sum_completion_tokens: 15_000,
      completion_audio_tokens: 0,
      prompt_cache_write_5m: 0,
      prompt_cache_write_1h: 0,
    });
    expect(opus).toBeCloseTo(0.625, 10);

    const fable51 = modelCost({
      provider: "ANTHROPIC",
      model: "claude-fable-5-1",
      sum_prompt_tokens: 0,
      prompt_cache_write_tokens: 2_000_000,
      prompt_cache_read_tokens: 1_000_000,
      prompt_audio_tokens: 0,
      sum_completion_tokens: 0,
      completion_audio_tokens: 0,
      prompt_cache_write_5m: 1_000_000,
      prompt_cache_write_1h: 1_000_000,
    });
    // $0.25 cache read + $12.50 5m write + $20 1h write
    expect(fable51).toBeCloseTo(32.75, 10);
  });
});