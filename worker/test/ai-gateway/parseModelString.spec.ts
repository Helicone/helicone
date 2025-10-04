import { AttemptBuilder } from "../../src/lib/ai-gateway/AttemptBuilder";
import { ProviderKeysManager } from "../../src/lib/managers/ProviderKeysManager";
import { ProviderKeysStore } from "../../src/lib/db/ProviderKeysStore";

describe("parseModelString", () => {
  let attemptBuilder: AttemptBuilder;

  beforeEach(() => {
    // Mock dependencies
    const mockProviderKeysStore = {} as ProviderKeysStore;
    const mockProviderKeysManager = new ProviderKeysManager(
      mockProviderKeysStore,
      {} as Env
    );
    attemptBuilder = new AttemptBuilder(mockProviderKeysManager, {} as Env);
  });

  describe(":online suffix handling", () => {
    it("should strip :online suffix and set isOnline flag", () => {
      const result = attemptBuilder.parseModelString("claude-3-5-sonnet-20241022:online");

      expect(result).toEqual({
        data: {
          modelName: "claude-3-5-sonnet-20241022",
          isOnline: true
        },
        error: null
      });
    });

    it("should strip :online suffix with provider", () => {
      const result = attemptBuilder.parseModelString("claude-3-5-sonnet-20241022:online/anthropic");

      expect(result).toEqual({
        data: {
          modelName: "claude-3-5-sonnet-20241022",
          provider: "anthropic",
          isOnline: true
        },
        error: null
      });
    });

    it("should strip :online suffix with provider and customUid", () => {
      const result = attemptBuilder.parseModelString("claude-3-5-sonnet-20241022:online/anthropic/custom123");

      expect(result).toEqual({
        data: {
          modelName: "claude-3-5-sonnet-20241022",
          provider: "anthropic",
          customUid: "custom123",
          isOnline: true
        },
        error: null
      });
    });

    it("should parse model without :online suffix", () => {
      const result = attemptBuilder.parseModelString("claude-3-5-sonnet-20241022");

      expect(result.data).toEqual({
        modelName: "claude-3-5-sonnet-20241022",
        isOnline: false
      });
    });

    it("should strip :online suffix from gpt models", () => {
      const result = attemptBuilder.parseModelString("gpt-4o:online");

      expect(result).toEqual({
        data: {
          modelName: "gpt-4o",
          isOnline: true
        },
        error: null
      });
    });

    it("should only strip :online when it's at the end", () => {
      // Test that :online is only recognized at the end
      const result = attemptBuilder.parseModelString("model:online-test");

      // This should not detect :online since it's not at the end
      expect(result.data?.modelName).toBe("model:online-test");
      expect(result.data?.isOnline).toBe(false);
    });
  });

  describe("standard model parsing", () => {
    it("should parse model with provider", () => {
      const result = attemptBuilder.parseModelString("claude-3-5-sonnet-20241022/anthropic");

      expect(result).toEqual({
        data: {
          modelName: "claude-3-5-sonnet-20241022",
          provider: "anthropic",
          isOnline: false
        },
        error: null
      });
    });

    it("should parse model with provider and customUid", () => {
      const result = attemptBuilder.parseModelString("claude-3-5-sonnet-20241022/anthropic/custom123");

      expect(result).toEqual({
        data: {
          modelName: "claude-3-5-sonnet-20241022",
          provider: "anthropic",
          customUid: "custom123",
          isOnline: false
        },
        error: null
      });
    });

    it("should handle invalid provider", () => {
      const result = attemptBuilder.parseModelString("claude-3-5-sonnet-20241022/invalid-provider");

      expect(result.error).toContain("Invalid provider: invalid-provider");
    });
  });
});