import {
  mapHeliconeModelToStripe,
  mapStripeModelToHelicone,
  isModelSupportedInStripe,
  getAllSupportedStripeModels,
  getAllSupportedHeliconeModels,
  getSupportedModelCount,
  // Legacy exports
  mapModelToStripeFormat,
  isModelAvailableInStripe,
  getAvailableStripeModels,
} from "../../stripe-mapping";

describe("Stripe Model Mapping", () => {
  describe("mapHeliconeModelToStripe", () => {
    it("should map Anthropic models correctly", () => {
      expect(mapHeliconeModelToStripe("anthropic/claude-3.5-haiku")).toBe("anthropic/claude-3-5-haiku");
      expect(mapHeliconeModelToStripe("anthropic/claude-haiku-4.5")).toBe("anthropic/claude-haiku-4-5");
      expect(mapHeliconeModelToStripe("anthropic/claude-3.7-sonnet")).toBe("anthropic/claude-3-7-sonnet");
      expect(mapHeliconeModelToStripe("anthropic/claude-opus-4.1")).toBe("anthropic/claude-opus-4-1");
      expect(mapHeliconeModelToStripe("anthropic/claude-sonnet-4.5")).toBe("anthropic/claude-sonnet-4-5");
      expect(mapHeliconeModelToStripe("anthropic/claude-3-haiku")).toBe("anthropic/claude-3-haiku");
      expect(mapHeliconeModelToStripe("anthropic/claude-opus-4")).toBe("anthropic/claude-opus-4");
      expect(mapHeliconeModelToStripe("anthropic/claude-sonnet-4")).toBe("anthropic/claude-sonnet-4");
    });

    it("should map Google models correctly", () => {
      expect(mapHeliconeModelToStripe("google/gemini-2.0-flash")).toBe("google/gemini-2-0-flash");
      expect(mapHeliconeModelToStripe("google/gemini-2.0-flash-lite")).toBe("google/gemini-2-0-flash-lite");
      expect(mapHeliconeModelToStripe("google/gemini-2.5-flash")).toBe("google/gemini-2-5-flash");
      expect(mapHeliconeModelToStripe("google/gemini-2.5-flash-audio")).toBe("google/gemini-2-5-flash-audio");
      expect(mapHeliconeModelToStripe("google/gemini-2.5-pro")).toBe("google/gemini-2-5-pro");
      expect(mapHeliconeModelToStripe("google/gemini-live-2.5-flash-preview")).toBe("google/gemini-live-2-5-flash-preview");
    });

    it("should map OpenAI models correctly", () => {
      expect(mapHeliconeModelToStripe("openai/gpt-4.1")).toBe("openai/gpt-4-1");
      expect(mapHeliconeModelToStripe("openai/gpt-4.1-mini")).toBe("openai/gpt-4-1-mini");
      expect(mapHeliconeModelToStripe("openai/gpt-4.1-nano")).toBe("openai/gpt-4-1-nano");
      expect(mapHeliconeModelToStripe("openai/gpt-4o")).toBe("openai/gpt-4o");
      expect(mapHeliconeModelToStripe("openai/gpt-4o-mini")).toBe("openai/gpt-4o-mini");
      expect(mapHeliconeModelToStripe("openai/gpt-5")).toBe("openai/gpt-5");
      expect(mapHeliconeModelToStripe("openai/o1")).toBe("openai/o1");
      expect(mapHeliconeModelToStripe("openai/o3-pro")).toBe("openai/o3-pro");
    });

    it("should map Perplexity models correctly", () => {
      expect(mapHeliconeModelToStripe("perplexity/sonar-reasoning-pro")).toBe("perplexity/sonar-reasoning-pro");
      expect(mapHeliconeModelToStripe("perplexity/sonar-pro")).toBe("perplexity/sonar-pro");
      expect(mapHeliconeModelToStripe("perplexity/sonar-deep-research")).toBe("perplexity/sonar-deep-research");
      expect(mapHeliconeModelToStripe("perplexity/sonar-reasoning")).toBe("perplexity/sonar-reasoning");
      expect(mapHeliconeModelToStripe("perplexity/sonar")).toBe("perplexity/sonar");
    });

    it("should return null for unsupported models", () => {
      expect(mapHeliconeModelToStripe("unsupported/model")).toBe(null);
      expect(mapHeliconeModelToStripe("anthropic/claude-unknown")).toBe(null);
      expect(mapHeliconeModelToStripe("")).toBe(null);
      expect(mapHeliconeModelToStripe("   ")).toBe(null);
    });

    it("should handle invalid input", () => {
      // @ts-ignore
      expect(mapHeliconeModelToStripe(null)).toBe(null);
      // @ts-ignore
      expect(mapHeliconeModelToStripe(undefined)).toBe(null);
      // @ts-ignore
      expect(mapHeliconeModelToStripe(123)).toBe(null);
      expect(mapHeliconeModelToStripe("")).toBe(null);
    });

    it("should trim whitespace", () => {
      expect(mapHeliconeModelToStripe("  anthropic/claude-3.5-haiku  ")).toBe("anthropic/claude-3-5-haiku");
    });
  });

  describe("mapStripeModelToHelicone", () => {
    it("should map Stripe models back to Helicone format", () => {
      expect(mapStripeModelToHelicone("anthropic/claude-3-5-haiku")).toBe("anthropic/claude-3.5-haiku");
      expect(mapStripeModelToHelicone("anthropic/claude-haiku-4-5")).toBe("anthropic/claude-haiku-4.5");
      expect(mapStripeModelToHelicone("openai/gpt-4-1")).toBe("openai/gpt-4.1");
      expect(mapStripeModelToHelicone("google/gemini-2-5-flash")).toBe("google/gemini-2.5-flash");
      expect(mapStripeModelToHelicone("perplexity/sonar")).toBe("perplexity/sonar");
    });

    it("should return null for unsupported models", () => {
      expect(mapStripeModelToHelicone("unsupported/model")).toBe(null);
      expect(mapStripeModelToHelicone("")).toBe(null);
    });

    it("should handle invalid input", () => {
      // @ts-ignore
      expect(mapStripeModelToHelicone(null)).toBe(null);
      // @ts-ignore
      expect(mapStripeModelToHelicone(undefined)).toBe(null);
      // @ts-ignore
      expect(mapStripeModelToHelicone(123)).toBe(null);
    });
  });

  describe("isModelSupportedInStripe", () => {
    it("should recognize supported models in Helicone format", () => {
      expect(isModelSupportedInStripe("anthropic/claude-3.5-haiku")).toBe(true);
      expect(isModelSupportedInStripe("openai/gpt-4.1")).toBe(true);
      expect(isModelSupportedInStripe("google/gemini-2.5-flash")).toBe(true);
    });

    it("should recognize supported models in Stripe format", () => {
      expect(isModelSupportedInStripe("anthropic/claude-3-5-haiku")).toBe(true);
      expect(isModelSupportedInStripe("openai/gpt-4-1")).toBe(true);
      expect(isModelSupportedInStripe("google/gemini-2-5-flash")).toBe(true);
    });

    it("should return false for unsupported models", () => {
      expect(isModelSupportedInStripe("unsupported/model")).toBe(false);
      expect(isModelSupportedInStripe("")).toBe(false);
      expect(isModelSupportedInStripe("   ")).toBe(false);
    });

    it("should handle invalid input", () => {
      // @ts-ignore
      expect(isModelSupportedInStripe(null)).toBe(false);
      // @ts-ignore
      expect(isModelSupportedInStripe(undefined)).toBe(false);
      // @ts-ignore
      expect(isModelSupportedInStripe(123)).toBe(false);
    });
  });

  describe("getAllSupportedStripeModels", () => {
    it("should return all 46 Stripe models", () => {
      const models = getAllSupportedStripeModels();
      expect(models.length).toBe(46);
      expect(models).toContain("anthropic/claude-3-5-haiku");
      expect(models).toContain("openai/gpt-4-1");
      expect(models).toContain("google/gemini-2-5-flash");
      expect(models).toContain("perplexity/sonar");
    });

    it("should return sorted array", () => {
      const models = getAllSupportedStripeModels();
      const sortedModels = [...models].sort();
      expect(models).toEqual(sortedModels);
    });
  });

  describe("getAllSupportedHeliconeModels", () => {
    it("should return all 46 Helicone models", () => {
      const models = getAllSupportedHeliconeModels();
      expect(models.length).toBe(46);
      expect(models).toContain("anthropic/claude-3.5-haiku");
      expect(models).toContain("openai/gpt-4.1");
      expect(models).toContain("google/gemini-2.5-flash");
      expect(models).toContain("perplexity/sonar");
    });

    it("should return sorted array", () => {
      const models = getAllSupportedHeliconeModels();
      const sortedModels = [...models].sort();
      expect(models).toEqual(sortedModels);
    });
  });

  describe("getSupportedModelCount", () => {
    it("should return 46", () => {
      expect(getSupportedModelCount()).toBe(46);
    });
  });

  describe("bidirectional mapping integrity", () => {
    it("should map correctly both directions for all models", () => {
      const stripeModels = getAllSupportedStripeModels();
      const heliconeModels = getAllSupportedHeliconeModels();
      
      expect(stripeModels.length).toBe(heliconeModels.length);

      // Test Helicone -> Stripe -> Helicone roundtrip
      for (const heliconeModel of heliconeModels) {
        const stripeModel = mapHeliconeModelToStripe(heliconeModel);
        expect(stripeModel).not.toBe(null);
        const backToHelicone = mapStripeModelToHelicone(stripeModel!);
        expect(backToHelicone).toBe(heliconeModel);
      }

      // Test Stripe -> Helicone -> Stripe roundtrip
      for (const stripeModel of stripeModels) {
        const heliconeModel = mapStripeModelToHelicone(stripeModel);
        expect(heliconeModel).not.toBe(null);
        const backToStripe = mapHeliconeModelToStripe(heliconeModel!);
        expect(backToStripe).toBe(stripeModel);
      }
    });
  });

  describe("all 46 specific models from user requirements", () => {
    const expectedStripeModels = [
      // Anthropic models (8 total)
      "anthropic/claude-3-5-haiku",
      "anthropic/claude-haiku-4-5",
      "anthropic/claude-3-7-sonnet",
      "anthropic/claude-3-haiku",
      "anthropic/claude-opus-4",
      "anthropic/claude-opus-4-1",
      "anthropic/claude-sonnet-4",
      "anthropic/claude-sonnet-4-5",
      
      // Google models (17 total)
      "google/gemini-2-0-flash",
      "google/gemini-2-0-flash-lite",
      "google/gemini-2-5-flash",
      "google/gemini-2-5-flash-audio",
      "google/gemini-2-5-flash-image-preview",
      "google/gemini-2-5-flash-lite",
      "google/gemini-2-5-flash-lite-audio",
      "google/gemini-2-5-flash-preview-native-audio-dialog",
      "google/gemini-2-5-flash-preview-native-audio-dialog-audio",
      "google/gemini-2-5-flash-preview-native-audio-dialog-audio-video",
      "google/gemini-2-5-flash-preview-tts",
      "google/gemini-2-5-pro",
      "google/gemini-2-5-pro-above200k",
      "google/gemini-2-5-pro-preview-tts",
      "google/gemini-live-2-5-flash-preview",
      "google/gemini-live-2-5-flash-preview-audio",
      "google/gemini-live-2-5-flash-preview-audio-video",
      
      // OpenAI models (16 total)
      "openai/gpt-4-1",
      "openai/gpt-4-1-mini",
      "openai/gpt-4-1-nano",
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "openai/gpt-5",
      "openai/gpt-5-mini",
      "openai/gpt-5-nano",
      "openai/o1",
      "openai/o1-mini",
      "openai/o1-pro",
      "openai/o3",
      "openai/o3-mini",
      "openai/o3-pro",
      "openai/o4-mini",
      
      // Perplexity models (5 total)
      "perplexity/sonar-reasoning-pro",
      "perplexity/sonar-pro",
      "perplexity/sonar-deep-research",
      "perplexity/sonar-reasoning",
      "perplexity/sonar",
    ];

    it("should support all 46 required Stripe models", () => {
      const supportedModels = getAllSupportedStripeModels();
      
      // Check count
      expect(supportedModels.length).toBe(46);
      expect(expectedStripeModels.length).toBe(46);
      
      // Check each model is supported
      for (const model of expectedStripeModels) {
        expect(supportedModels).toContain(model);
        expect(isModelSupportedInStripe(model)).toBe(true);
      }
    });

    it("should map each required model to correct Helicone format", () => {
      // Test specific mappings that involve dots
      expect(mapStripeModelToHelicone("anthropic/claude-3-5-haiku")).toBe("anthropic/claude-3.5-haiku");
      expect(mapStripeModelToHelicone("anthropic/claude-haiku-4-5")).toBe("anthropic/claude-haiku-4.5");
      expect(mapStripeModelToHelicone("anthropic/claude-3-7-sonnet")).toBe("anthropic/claude-3.7-sonnet");
      expect(mapStripeModelToHelicone("anthropic/claude-opus-4-1")).toBe("anthropic/claude-opus-4.1");
      expect(mapStripeModelToHelicone("anthropic/claude-sonnet-4-5")).toBe("anthropic/claude-sonnet-4.5");
      
      expect(mapStripeModelToHelicone("google/gemini-2-0-flash")).toBe("google/gemini-2.0-flash");
      expect(mapStripeModelToHelicone("google/gemini-2-5-flash")).toBe("google/gemini-2.5-flash");
      expect(mapStripeModelToHelicone("google/gemini-2-5-pro")).toBe("google/gemini-2.5-pro");
      expect(mapStripeModelToHelicone("google/gemini-live-2-5-flash-preview")).toBe("google/gemini-live-2.5-flash-preview");
      
      expect(mapStripeModelToHelicone("openai/gpt-4-1")).toBe("openai/gpt-4.1");
      expect(mapStripeModelToHelicone("openai/gpt-4-1-mini")).toBe("openai/gpt-4.1-mini");
      expect(mapStripeModelToHelicone("openai/gpt-4-1-nano")).toBe("openai/gpt-4.1-nano");
      
      // Models without dots should map to themselves
      expect(mapStripeModelToHelicone("anthropic/claude-3-haiku")).toBe("anthropic/claude-3-haiku");
      expect(mapStripeModelToHelicone("openai/gpt-4o")).toBe("openai/gpt-4o");
      expect(mapStripeModelToHelicone("perplexity/sonar")).toBe("perplexity/sonar");
    });
  });

  describe("legacy compatibility", () => {
    it("should provide backward compatible exports", () => {
      expect(mapModelToStripeFormat).toBe(mapHeliconeModelToStripe);
      expect(isModelAvailableInStripe).toBe(isModelSupportedInStripe);
      expect(getAvailableStripeModels).toBe(getAllSupportedStripeModels);
    });

    it("should work with legacy function names", () => {
      expect(mapModelToStripeFormat("anthropic/claude-3.5-haiku")).toBe("anthropic/claude-3-5-haiku");
      expect(isModelAvailableInStripe("anthropic/claude-3.5-haiku")).toBe(true);
      expect(getAvailableStripeModels().length).toBe(46);
    });
  });

  describe("edge cases and performance", () => {
    it("should handle models with multiple dots correctly", () => {
      // These shouldn't be supported since they're not in our explicit mapping
      expect(mapHeliconeModelToStripe("fake/model-1.2.3")).toBe(null);
      expect(isModelSupportedInStripe("fake/model-1.2.3")).toBe(false);
    });

    it("should be performant for repeated calls", () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        mapHeliconeModelToStripe("anthropic/claude-3.5-haiku");
        isModelSupportedInStripe("openai/gpt-4.1");
      }
      const end = performance.now();
      expect(end - start).toBeLessThan(100); // Should complete 2000 operations in under 100ms
    });

    it("should handle case sensitivity correctly", () => {
      // Our mapping is case-sensitive
      expect(mapHeliconeModelToStripe("Anthropic/claude-3.5-haiku")).toBe(null);
      expect(mapHeliconeModelToStripe("anthropic/Claude-3.5-haiku")).toBe(null);
    });
  });
});