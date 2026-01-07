import { describe, expect, test } from "@jest/globals";
import {
  getReasoningTokens,
  getCompletionTokens,
  getPromptTokens,
  getPromptCacheWriteTokens,
  getPromptCacheReadTokens,
  getPromptAudioTokens,
  getCompletionAudioTokens,
  Usage,
} from "../HandlerContext";
import { ModelUsage } from "@helicone-package/cost/usage/types";

// Helper to create a minimal ModelUsage object
function makeModelUsage(overrides: Partial<ModelUsage> = {}): ModelUsage {
  return {
    input: 0,
    output: 0,
    ...overrides,
  };
}

describe("HandlerContext Token Functions", () => {
  describe("getReasoningTokens", () => {
    test("returns null when modelUsage is undefined", () => {
      const result = getReasoningTokens(undefined);
      expect(result).toBeNull();
    });

    test("returns null when thinking is undefined", () => {
      const modelUsage = makeModelUsage();
      const result = getReasoningTokens(modelUsage);
      expect(result).toBeNull();
    });

    test("returns null when thinking is 0", () => {
      const modelUsage = makeModelUsage({ thinking: 0 });
      const result = getReasoningTokens(modelUsage);
      expect(result).toBeNull();
    });

    test("returns thinking tokens when thinking > 0", () => {
      const modelUsage = makeModelUsage({ thinking: 150 });
      const result = getReasoningTokens(modelUsage);
      expect(result).toBe(150);
    });

    test("returns correct value for large thinking token counts", () => {
      const modelUsage = makeModelUsage({ thinking: 10000 });
      const result = getReasoningTokens(modelUsage);
      expect(result).toBe(10000);
    });
  });

  describe("getCompletionTokens", () => {
    const emptyUsage: Usage = {};

    test("returns null when both modelUsage and legacyUsage are empty", () => {
      const result = getCompletionTokens(undefined, emptyUsage);
      expect(result).toBeNull();
    });

    test("returns legacyUsage.completionTokens when modelUsage is undefined", () => {
      const legacyUsage: Usage = { completionTokens: 100 };
      const result = getCompletionTokens(undefined, legacyUsage);
      expect(result).toBe(100);
    });

    test("returns output tokens from modelUsage", () => {
      const modelUsage = makeModelUsage({ output: 200 });
      const result = getCompletionTokens(modelUsage, emptyUsage);
      expect(result).toBe(200);
    });

    test("does NOT include thinking tokens in completion tokens", () => {
      const modelUsage = makeModelUsage({
        output: 200,
        thinking: 500, // This should NOT be included
      });
      const result = getCompletionTokens(modelUsage, emptyUsage);
      expect(result).toBe(200); // Only output, not output + thinking
    });

    test("includes audio output in completion tokens", () => {
      const modelUsage = makeModelUsage({
        output: 100,
        audio: { output: 50 },
      });
      const result = getCompletionTokens(modelUsage, emptyUsage);
      expect(result).toBe(150);
    });

    test("includes all modality outputs in completion tokens", () => {
      const modelUsage = makeModelUsage({
        output: 100,
        audio: { output: 20 },
        image: { output: 30 },
        video: { output: 40 },
        file: { output: 10 },
      });
      const result = getCompletionTokens(modelUsage, emptyUsage);
      expect(result).toBe(200); // 100 + 20 + 30 + 40 + 10
    });

    test("excludes thinking even with multiple modalities", () => {
      const modelUsage = makeModelUsage({
        output: 100,
        thinking: 1000,
        audio: { output: 50 },
      });
      const result = getCompletionTokens(modelUsage, emptyUsage);
      expect(result).toBe(150); // 100 + 50, NOT including 1000 thinking
    });

    test("falls back to legacyUsage when modelUsage has no output", () => {
      const modelUsage = makeModelUsage({ output: 0 });
      const legacyUsage: Usage = { completionTokens: 75 };
      const result = getCompletionTokens(modelUsage, legacyUsage);
      expect(result).toBe(75);
    });
  });

  describe("getPromptTokens", () => {
    const emptyUsage: Usage = {};

    test("returns null when both modelUsage and legacyUsage are empty", () => {
      const result = getPromptTokens(undefined, emptyUsage);
      expect(result).toBeNull();
    });

    test("returns legacyUsage.promptTokens when modelUsage is undefined", () => {
      const legacyUsage: Usage = { promptTokens: 50 };
      const result = getPromptTokens(undefined, legacyUsage);
      expect(result).toBe(50);
    });

    test("returns input tokens from modelUsage", () => {
      const modelUsage = makeModelUsage({ input: 100 });
      const result = getPromptTokens(modelUsage, emptyUsage);
      expect(result).toBe(100);
    });

    test("includes all modality inputs in prompt tokens", () => {
      const modelUsage = makeModelUsage({
        input: 100,
        audio: { input: 20 },
        image: { input: 30 },
        video: { input: 40 },
        file: { input: 10 },
      });
      const result = getPromptTokens(modelUsage, emptyUsage);
      expect(result).toBe(200); // 100 + 20 + 30 + 40 + 10
    });
  });

  describe("getPromptCacheWriteTokens", () => {
    const emptyUsage: Usage = {};

    test("returns null when both are empty", () => {
      const result = getPromptCacheWriteTokens(undefined, emptyUsage);
      expect(result).toBeNull();
    });

    test("returns sum of write5m and write1h from cacheDetails", () => {
      const modelUsage = makeModelUsage({
        cacheDetails: {
          cachedInput: 0,
          write5m: 100,
          write1h: 50,
        },
      });
      const result = getPromptCacheWriteTokens(modelUsage, emptyUsage);
      expect(result).toBe(150);
    });

    test("falls back to legacyUsage when no cacheDetails", () => {
      const legacyUsage: Usage = { promptCacheWriteTokens: 200 };
      const result = getPromptCacheWriteTokens(undefined, legacyUsage);
      expect(result).toBe(200);
    });
  });

  describe("getPromptCacheReadTokens", () => {
    const emptyUsage: Usage = {};

    test("returns null when both are empty", () => {
      const result = getPromptCacheReadTokens(undefined, emptyUsage);
      expect(result).toBeNull();
    });

    test("returns cachedInput from cacheDetails", () => {
      const modelUsage = makeModelUsage({
        cacheDetails: {
          cachedInput: 300,
        },
      });
      const result = getPromptCacheReadTokens(modelUsage, emptyUsage);
      expect(result).toBe(300);
    });

    test("includes cached inputs from all modalities", () => {
      const modelUsage = makeModelUsage({
        cacheDetails: { cachedInput: 100 },
        audio: { cachedInput: 50 },
        image: { cachedInput: 25 },
      });
      const result = getPromptCacheReadTokens(modelUsage, emptyUsage);
      expect(result).toBe(175);
    });
  });

  describe("getPromptAudioTokens", () => {
    const emptyUsage: Usage = {};

    test("returns null when both are empty", () => {
      const result = getPromptAudioTokens(undefined, emptyUsage);
      expect(result).toBeNull();
    });

    test("returns audio input from modelUsage", () => {
      const modelUsage = makeModelUsage({
        audio: { input: 500 },
      });
      const result = getPromptAudioTokens(modelUsage, emptyUsage);
      expect(result).toBe(500);
    });

    test("falls back to legacyUsage when no audio input", () => {
      const legacyUsage: Usage = { promptAudioTokens: 250 };
      const result = getPromptAudioTokens(undefined, legacyUsage);
      expect(result).toBe(250);
    });
  });

  describe("getCompletionAudioTokens", () => {
    const emptyUsage: Usage = {};

    test("returns null when both are empty", () => {
      const result = getCompletionAudioTokens(undefined, emptyUsage);
      expect(result).toBeNull();
    });

    test("returns audio output from modelUsage", () => {
      const modelUsage = makeModelUsage({
        audio: { output: 750 },
      });
      const result = getCompletionAudioTokens(modelUsage, emptyUsage);
      expect(result).toBe(750);
    });

    test("falls back to legacyUsage when no audio output", () => {
      const legacyUsage: Usage = { completionAudioTokens: 400 };
      const result = getCompletionAudioTokens(undefined, legacyUsage);
      expect(result).toBe(400);
    });
  });

  describe("Token calculation integration scenarios", () => {
    test("reasoning model scenario: o1 with thinking tokens", () => {
      // Simulating an o1 response with reasoning/thinking tokens
      const modelUsage = makeModelUsage({
        input: 500, // prompt tokens
        output: 200, // completion tokens (actual response)
        thinking: 3000, // reasoning tokens (internal chain-of-thought)
      });
      const legacyUsage: Usage = {};

      const promptTokens = getPromptTokens(modelUsage, legacyUsage);
      const completionTokens = getCompletionTokens(modelUsage, legacyUsage);
      const reasoningTokens = getReasoningTokens(modelUsage);

      expect(promptTokens).toBe(500);
      expect(completionTokens).toBe(200); // Should NOT include thinking
      expect(reasoningTokens).toBe(3000);

      // Total should be prompt + completion + reasoning
      const totalTokens =
        (promptTokens ?? 0) + (completionTokens ?? 0) + (reasoningTokens ?? 0);
      expect(totalTokens).toBe(3700);
    });

    test("standard model scenario: no thinking tokens", () => {
      const modelUsage = makeModelUsage({
        input: 100,
        output: 50,
      });
      const legacyUsage: Usage = {};

      const promptTokens = getPromptTokens(modelUsage, legacyUsage);
      const completionTokens = getCompletionTokens(modelUsage, legacyUsage);
      const reasoningTokens = getReasoningTokens(modelUsage);

      expect(promptTokens).toBe(100);
      expect(completionTokens).toBe(50);
      expect(reasoningTokens).toBeNull();

      // Total should be prompt + completion (reasoning is null/0)
      const totalTokens =
        (promptTokens ?? 0) + (completionTokens ?? 0) + (reasoningTokens ?? 0);
      expect(totalTokens).toBe(150);
    });

    test("multimodal with reasoning: audio + thinking tokens", () => {
      const modelUsage = makeModelUsage({
        input: 100,
        output: 50,
        thinking: 500,
        audio: { input: 200, output: 100 },
      });
      const legacyUsage: Usage = {};

      const promptTokens = getPromptTokens(modelUsage, legacyUsage);
      const completionTokens = getCompletionTokens(modelUsage, legacyUsage);
      const reasoningTokens = getReasoningTokens(modelUsage);
      const promptAudioTokens = getPromptAudioTokens(modelUsage, legacyUsage);
      const completionAudioTokens = getCompletionAudioTokens(
        modelUsage,
        legacyUsage
      );

      expect(promptTokens).toBe(300); // 100 + 200 audio input
      expect(completionTokens).toBe(150); // 50 + 100 audio output (NO thinking)
      expect(reasoningTokens).toBe(500);
      expect(promptAudioTokens).toBe(200);
      expect(completionAudioTokens).toBe(100);
    });
  });
});
