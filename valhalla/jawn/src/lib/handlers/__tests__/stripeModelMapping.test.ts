import {
  mapModelToStripeFormat,
  isModelAvailableInStripe,
  getAvailableStripeModels,
} from "../../../../../packages/stripe-mapping";

describe("Stripe Model Mapping", () => {
  describe("mapModelToStripeFormat", () => {
    describe("Anthropic models", () => {
      it("should map claude-3.5-haiku to claude-3-5-haiku", () => {
        expect(mapModelToStripeFormat("anthropic/claude-3.5-haiku")).toBe(
          "anthropic/claude-3-5-haiku"
        );
      });

      it("should map claude-haiku-4.5 to claude-haiku-4-5", () => {
        expect(mapModelToStripeFormat("anthropic/claude-haiku-4.5")).toBe(
          "anthropic/claude-haiku-4-5"
        );
      });

      it("should map claude-3.7-sonnet to claude-3-7-sonnet", () => {
        expect(mapModelToStripeFormat("anthropic/claude-3.7-sonnet")).toBe(
          "anthropic/claude-3-7-sonnet"
        );
      });

      it("should map claude-3-haiku (no dots) correctly", () => {
        expect(mapModelToStripeFormat("anthropic/claude-3-haiku")).toBe(
          "anthropic/claude-3-haiku"
        );
      });

      it("should map claude-opus-4 correctly", () => {
        expect(mapModelToStripeFormat("anthropic/claude-opus-4")).toBe(
          "anthropic/claude-opus-4"
        );
      });

      it("should map claude-opus-4.1 to claude-opus-4-1", () => {
        expect(mapModelToStripeFormat("anthropic/claude-opus-4.1")).toBe(
          "anthropic/claude-opus-4-1"
        );
      });

      it("should map claude-sonnet-4 correctly", () => {
        expect(mapModelToStripeFormat("anthropic/claude-sonnet-4")).toBe(
          "anthropic/claude-sonnet-4"
        );
      });

      it("should map claude-sonnet-4.5 to claude-sonnet-4-5", () => {
        expect(mapModelToStripeFormat("anthropic/claude-sonnet-4.5")).toBe(
          "anthropic/claude-sonnet-4-5"
        );
      });
    });

    describe("Google Gemini models", () => {
      it("should map gemini-2.0-flash to gemini-2-0-flash", () => {
        expect(mapModelToStripeFormat("google/gemini-2.0-flash")).toBe(
          "google/gemini-2-0-flash"
        );
      });

      it("should map gemini-2.0-flash-lite to gemini-2-0-flash-lite", () => {
        expect(mapModelToStripeFormat("google/gemini-2.0-flash-lite")).toBe(
          "google/gemini-2-0-flash-lite"
        );
      });

      it("should map gemini-2.5-flash to gemini-2-5-flash", () => {
        expect(mapModelToStripeFormat("google/gemini-2.5-flash")).toBe(
          "google/gemini-2-5-flash"
        );
      });

      it("should map gemini-2.5-flash-audio to gemini-2-5-flash-audio", () => {
        expect(mapModelToStripeFormat("google/gemini-2.5-flash-audio")).toBe(
          "google/gemini-2-5-flash-audio"
        );
      });

      it("should map gemini-2.5-flash-image-preview to gemini-2-5-flash-image-preview", () => {
        expect(
          mapModelToStripeFormat("google/gemini-2.5-flash-image-preview")
        ).toBe("google/gemini-2-5-flash-image-preview");
      });

      it("should map gemini-2.5-flash-lite to gemini-2-5-flash-lite", () => {
        expect(mapModelToStripeFormat("google/gemini-2.5-flash-lite")).toBe(
          "google/gemini-2-5-flash-lite"
        );
      });

      it("should map gemini-2.5-flash-lite-audio to gemini-2-5-flash-lite-audio", () => {
        expect(
          mapModelToStripeFormat("google/gemini-2.5-flash-lite-audio")
        ).toBe("google/gemini-2-5-flash-lite-audio");
      });

      it("should map gemini-2.5-flash-preview-native-audio-dialog", () => {
        expect(
          mapModelToStripeFormat(
            "google/gemini-2.5-flash-preview-native-audio-dialog"
          )
        ).toBe("google/gemini-2-5-flash-preview-native-audio-dialog");
      });

      it("should map gemini-2.5-flash-preview-native-audio-dialog-audio", () => {
        expect(
          mapModelToStripeFormat(
            "google/gemini-2.5-flash-preview-native-audio-dialog-audio"
          )
        ).toBe("google/gemini-2-5-flash-preview-native-audio-dialog-audio");
      });

      it("should map gemini-2.5-flash-preview-native-audio-dialog-audio-video", () => {
        expect(
          mapModelToStripeFormat(
            "google/gemini-2.5-flash-preview-native-audio-dialog-audio-video"
          )
        ).toBe(
          "google/gemini-2-5-flash-preview-native-audio-dialog-audio-video"
        );
      });

      it("should map gemini-2.5-flash-preview-tts to gemini-2-5-flash-preview-tts", () => {
        expect(
          mapModelToStripeFormat("google/gemini-2.5-flash-preview-tts")
        ).toBe("google/gemini-2-5-flash-preview-tts");
      });

      it("should map gemini-2.5-pro to gemini-2-5-pro", () => {
        expect(mapModelToStripeFormat("google/gemini-2.5-pro")).toBe(
          "google/gemini-2-5-pro"
        );
      });

      it("should map gemini-2.5-pro-above200k to gemini-2-5-pro-above200k", () => {
        expect(mapModelToStripeFormat("google/gemini-2.5-pro-above200k")).toBe(
          "google/gemini-2-5-pro-above200k"
        );
      });

      it("should map gemini-2.5-pro-preview-tts to gemini-2-5-pro-preview-tts", () => {
        expect(
          mapModelToStripeFormat("google/gemini-2.5-pro-preview-tts")
        ).toBe("google/gemini-2-5-pro-preview-tts");
      });

      it("should map gemini-live-2.5-flash-preview to gemini-live-2-5-flash-preview", () => {
        expect(
          mapModelToStripeFormat("google/gemini-live-2.5-flash-preview")
        ).toBe("google/gemini-live-2-5-flash-preview");
      });

      it("should map gemini-live-2.5-flash-preview-audio", () => {
        expect(
          mapModelToStripeFormat("google/gemini-live-2.5-flash-preview-audio")
        ).toBe("google/gemini-live-2-5-flash-preview-audio");
      });

      it("should map gemini-live-2.5-flash-preview-audio-video", () => {
        expect(
          mapModelToStripeFormat(
            "google/gemini-live-2.5-flash-preview-audio-video"
          )
        ).toBe("google/gemini-live-2-5-flash-preview-audio-video");
      });
    });

    describe("OpenAI models", () => {
      it("should map gpt-4.1 to gpt-4-1", () => {
        expect(mapModelToStripeFormat("openai/gpt-4.1")).toBe("openai/gpt-4-1");
      });

      it("should map gpt-4.1-mini to gpt-4-1-mini", () => {
        expect(mapModelToStripeFormat("openai/gpt-4.1-mini")).toBe(
          "openai/gpt-4-1-mini"
        );
      });

      it("should map gpt-4.1-nano to gpt-4-1-nano", () => {
        expect(mapModelToStripeFormat("openai/gpt-4.1-nano")).toBe(
          "openai/gpt-4-1-nano"
        );
      });

      it("should map gpt-4o correctly (no dots)", () => {
        expect(mapModelToStripeFormat("openai/gpt-4o")).toBe("openai/gpt-4o");
      });

      it("should map gpt-4o-mini correctly (no dots)", () => {
        expect(mapModelToStripeFormat("openai/gpt-4o-mini")).toBe(
          "openai/gpt-4o-mini"
        );
      });

      it("should map gpt-5 correctly", () => {
        expect(mapModelToStripeFormat("openai/gpt-5")).toBe("openai/gpt-5");
      });

      it("should map gpt-5-mini correctly", () => {
        expect(mapModelToStripeFormat("openai/gpt-5-mini")).toBe(
          "openai/gpt-5-mini"
        );
      });

      it("should map gpt-5-nano correctly", () => {
        expect(mapModelToStripeFormat("openai/gpt-5-nano")).toBe(
          "openai/gpt-5-nano"
        );
      });

      it("should map o1 correctly", () => {
        expect(mapModelToStripeFormat("openai/o1")).toBe("openai/o1");
      });

      it("should map o1-mini correctly", () => {
        expect(mapModelToStripeFormat("openai/o1-mini")).toBe("openai/o1-mini");
      });

      it("should map o1-pro correctly", () => {
        expect(mapModelToStripeFormat("openai/o1-pro")).toBe("openai/o1-pro");
      });

      it("should map o3 correctly", () => {
        expect(mapModelToStripeFormat("openai/o3")).toBe("openai/o3");
      });

      it("should map o3-mini correctly", () => {
        expect(mapModelToStripeFormat("openai/o3-mini")).toBe("openai/o3-mini");
      });

      it("should map o3-pro correctly", () => {
        expect(mapModelToStripeFormat("openai/o3-pro")).toBe("openai/o3-pro");
      });

      it("should map o4-mini correctly", () => {
        expect(mapModelToStripeFormat("openai/o4-mini")).toBe("openai/o4-mini");
      });
    });

    describe("Perplexity models", () => {
      it("should map sonar-reasoning-pro correctly", () => {
        expect(mapModelToStripeFormat("perplexity/sonar-reasoning-pro")).toBe(
          "perplexity/sonar-reasoning-pro"
        );
      });

      it("should map sonar-pro correctly", () => {
        expect(mapModelToStripeFormat("perplexity/sonar-pro")).toBe(
          "perplexity/sonar-pro"
        );
      });

      it("should map sonar-deep-research correctly", () => {
        expect(mapModelToStripeFormat("perplexity/sonar-deep-research")).toBe(
          "perplexity/sonar-deep-research"
        );
      });

      it("should map sonar-reasoning correctly", () => {
        expect(mapModelToStripeFormat("perplexity/sonar-reasoning")).toBe(
          "perplexity/sonar-reasoning"
        );
      });

      it("should map sonar correctly", () => {
        expect(mapModelToStripeFormat("perplexity/sonar")).toBe(
          "perplexity/sonar"
        );
      });
    });

    describe("Unsupported models", () => {
      it("should return null for unknown models", () => {
        expect(mapModelToStripeFormat("unknown/model")).toBeNull();
      });

      it("should return null for empty string", () => {
        expect(mapModelToStripeFormat("")).toBeNull();
      });

      it("should return null for partially matching models", () => {
        expect(mapModelToStripeFormat("anthropic/claude-4")).toBeNull();
      });

      it("should return null for models with similar names", () => {
        expect(mapModelToStripeFormat("openai/gpt-4")).toBeNull();
      });

      it("should return null for models from unsupported providers", () => {
        expect(mapModelToStripeFormat("mistral/mixtral-8x7b")).toBeNull();
      });
    });

    describe("Edge cases", () => {
      it("should handle models already in Stripe format", () => {
        expect(mapModelToStripeFormat("anthropic/claude-3-5-haiku")).toBe(
          "anthropic/claude-3-5-haiku"
        );
      });

      it("should handle multiple dots in version numbers", () => {
        // If a model has multiple dots, they should all be converted
        // This tests the behavior but such models don't exist in the list
        expect(
          mapModelToStripeFormat("fake/model-1.2.3")
        ).toBeNull();
      });
    });
  });

  describe("isModelAvailableInStripe", () => {
    it("should return true for models already in Stripe format", () => {
      expect(isModelAvailableInStripe("anthropic/claude-3-5-haiku")).toBe(true);
    });

    it("should return true for models in internal format", () => {
      expect(isModelAvailableInStripe("anthropic/claude-3.5-haiku")).toBe(true);
    });

    it("should return false for unsupported models", () => {
      expect(isModelAvailableInStripe("unknown/model")).toBe(false);
    });

    it("should return true for Perplexity models", () => {
      expect(isModelAvailableInStripe("perplexity/sonar")).toBe(true);
    });
  });

  describe("getAvailableStripeModels", () => {
    it("should return an array", () => {
      const models = getAvailableStripeModels();
      expect(Array.isArray(models)).toBe(true);
    });

    it("should contain all expected Anthropic models", () => {
      const models = getAvailableStripeModels();
      expect(models).toContain("anthropic/claude-3-5-haiku");
      expect(models).toContain("anthropic/claude-haiku-4-5");
      expect(models).toContain("anthropic/claude-3-7-sonnet");
      expect(models).toContain("anthropic/claude-3-haiku");
      expect(models).toContain("anthropic/claude-opus-4");
      expect(models).toContain("anthropic/claude-opus-4-1");
      expect(models).toContain("anthropic/claude-sonnet-4");
      expect(models).toContain("anthropic/claude-sonnet-4-5");
    });

    it("should contain all expected OpenAI models", () => {
      const models = getAvailableStripeModels();
      expect(models).toContain("openai/gpt-4-1");
      expect(models).toContain("openai/gpt-4-1-mini");
      expect(models).toContain("openai/gpt-4-1-nano");
      expect(models).toContain("openai/gpt-4o");
      expect(models).toContain("openai/gpt-4o-mini");
      expect(models).toContain("openai/gpt-5");
      expect(models).toContain("openai/gpt-5-mini");
      expect(models).toContain("openai/gpt-5-nano");
      expect(models).toContain("openai/o1");
      expect(models).toContain("openai/o1-mini");
      expect(models).toContain("openai/o1-pro");
      expect(models).toContain("openai/o3");
      expect(models).toContain("openai/o3-mini");
      expect(models).toContain("openai/o3-pro");
      expect(models).toContain("openai/o4-mini");
    });

    it("should contain all expected Google Gemini models", () => {
      const models = getAvailableStripeModels();
      expect(models).toContain("google/gemini-2-0-flash");
      expect(models).toContain("google/gemini-2-0-flash-lite");
      expect(models).toContain("google/gemini-2-5-flash");
      expect(models).toContain("google/gemini-2-5-flash-audio");
      expect(models).toContain("google/gemini-2-5-flash-image-preview");
      expect(models).toContain("google/gemini-2-5-flash-lite");
      expect(models).toContain("google/gemini-2-5-flash-lite-audio");
      expect(models).toContain(
        "google/gemini-2-5-flash-preview-native-audio-dialog"
      );
      expect(models).toContain(
        "google/gemini-2-5-flash-preview-native-audio-dialog-audio"
      );
      expect(models).toContain(
        "google/gemini-2-5-flash-preview-native-audio-dialog-audio-video"
      );
      expect(models).toContain("google/gemini-2-5-flash-preview-tts");
      expect(models).toContain("google/gemini-2-5-pro");
      expect(models).toContain("google/gemini-2-5-pro-above200k");
      expect(models).toContain("google/gemini-2-5-pro-preview-tts");
      expect(models).toContain("google/gemini-live-2-5-flash-preview");
      expect(models).toContain("google/gemini-live-2-5-flash-preview-audio");
      expect(models).toContain(
        "google/gemini-live-2-5-flash-preview-audio-video"
      );
    });

    it("should contain all expected Perplexity models", () => {
      const models = getAvailableStripeModels();
      expect(models).toContain("perplexity/sonar-reasoning-pro");
      expect(models).toContain("perplexity/sonar-pro");
      expect(models).toContain("perplexity/sonar-deep-research");
      expect(models).toContain("perplexity/sonar-reasoning");
      expect(models).toContain("perplexity/sonar");
    });

    it("should return all 46 models", () => {
      const models = getAvailableStripeModels();
      expect(models.length).toBe(46);
    });
  });
});
