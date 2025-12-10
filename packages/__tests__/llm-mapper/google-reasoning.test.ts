import { describe, expect, it } from "@jest/globals";
import { toGoogle } from "../../llm-mapper/transform/providers/openai/request/toGoogle";
import { toOpenAI } from "../../llm-mapper/transform/providers/google/response/toOpenai";
import { GoogleToOpenAIStreamConverter } from "../../llm-mapper/transform/providers/google/streamedResponse/toOpenai";
import { HeliconeChatCreateParams } from "../../prompts/types";

describe("Google Reasoning/Thinking Support", () => {
  describe("Request Mapper (toGoogle)", () => {
    it("should map reasoning_effort 'high' to thinkingLevel 'high'", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-3-pro",
        messages: [{ role: "user", content: "What is 2+2?" }],
        reasoning_effort: "high",
      };

      const googleRequest = toGoogle(openAIRequest);

      expect(googleRequest.generationConfig?.thinkingConfig).toEqual({
        includeThoughts: true,
        thinkingLevel: "high",
      });
    });

    it("should map reasoning_effort 'low' to thinkingLevel 'low'", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-3-pro",
        messages: [{ role: "user", content: "Test" }],
        reasoning_effort: "low",
      };

      const googleRequest = toGoogle(openAIRequest);

      expect(googleRequest.generationConfig?.thinkingConfig).toEqual({
        includeThoughts: true,
        thinkingLevel: "low",
      });
    });

    it("should map reasoning_effort 'medium' to thinkingLevel 'low'", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-3-pro",
        messages: [{ role: "user", content: "Test" }],
        reasoning_effort: "medium",
      };

      const googleRequest = toGoogle(openAIRequest);

      // Google only supports low/high, so medium maps to low
      expect(googleRequest.generationConfig?.thinkingConfig).toEqual({
        includeThoughts: true,
        thinkingLevel: "low",
      });
    });

    it("should use thinkingBudget=-1 for reasoning_effort on Gemini 2.5 models", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "Test" }],
        reasoning_effort: "high",
      };

      const googleRequest = toGoogle(openAIRequest);

      // Gemini 2.5 doesn't support thinkingLevel, so use dynamic budget instead
      expect(googleRequest.generationConfig?.thinkingConfig).toEqual({
        includeThoughts: true,
        thinkingBudget: -1,
      });
    });

    it("should disable thinking when only budget_tokens is provided (without reasoning_effort)", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "What is 2+2?" }],
        reasoning_options: {
          budget_tokens: 100,
        },
      };

      const googleRequest = toGoogle(openAIRequest);

      // budget_tokens alone does NOT enable thinking - reasoning_effort is required
      expect(googleRequest.generationConfig?.thinkingConfig).toEqual({
        thinkingBudget: 0,
      });
    });

    it("should apply budget_tokens when reasoning_effort is also provided", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "What is 2+2?" }],
        reasoning_effort: "high",
        reasoning_options: {
          budget_tokens: 100,
        },
      };

      const googleRequest = toGoogle(openAIRequest);

      expect(googleRequest.generationConfig?.thinkingConfig).toEqual({
        includeThoughts: true,
        thinkingBudget: 100,
      });
    });

    it("should pass through thinking_level as thinkingLevel", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-3-pro",
        messages: [{ role: "user", content: "What is 2+2?" }],
        reasoning_options: {
          thinking_level: "high",
        },
      };

      const googleRequest = toGoogle(openAIRequest);

      expect(googleRequest.generationConfig?.thinkingConfig).toEqual({
        includeThoughts: true,
        thinkingLevel: "high",
      });
    });

    it("should combine reasoning_effort with reasoning_options.budget_tokens", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "Test" }],
        reasoning_effort: "high",
        reasoning_options: {
          budget_tokens: 2048,
        },
      };

      const googleRequest = toGoogle(openAIRequest);

      // Gemini 2.5 doesn't support thinkingLevel, so budget_tokens takes precedence
      expect(googleRequest.generationConfig?.thinkingConfig).toEqual({
        includeThoughts: true,
        thinkingBudget: 2048,
      });
    });

    it("should let reasoning_options.thinking_level override reasoning_effort", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-3-pro",
        messages: [{ role: "user", content: "Test" }],
        reasoning_effort: "high",
        reasoning_options: {
          thinking_level: "low",
        },
      };

      const googleRequest = toGoogle(openAIRequest);

      // thinking_level in reasoning_options should override reasoning_effort
      expect(googleRequest.generationConfig?.thinkingConfig).toEqual({
        includeThoughts: true,
        thinkingLevel: "low",
      });
    });

    it("should handle budget_tokens=-1 for dynamic thinking when reasoning_effort is set", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "Test" }],
        reasoning_effort: "high",
        reasoning_options: {
          budget_tokens: -1,
        },
      };

      const googleRequest = toGoogle(openAIRequest);

      expect(googleRequest.generationConfig?.thinkingConfig).toEqual({
        includeThoughts: true,
        thinkingBudget: -1,
      });
    });

    it("should disable thinking when no reasoning parameters provided", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-1.5-pro",
        messages: [{ role: "user", content: "Hello" }],
      };

      const googleRequest = toGoogle(openAIRequest);

      // Explicitly disable thinking by setting thinkingBudget to 0
      expect(googleRequest.generationConfig?.thinkingConfig).toEqual({
        thinkingBudget: 0,
      });
    });
  });

  describe("Response Mapper (toOpenAI)", () => {
    it("should extract reasoning from thought parts", () => {
      const googleResponse = {
        candidates: [
          {
            content: {
              role: "model",
              parts: [
                { text: "Let me think step by step...", thought: true },
                { text: "The answer is 4." },
              ],
            },
            finishReason: "STOP",
          },
        ],
        modelVersion: "gemini-2.5-flash",
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 15,
          thoughtsTokenCount: 10,
          totalTokenCount: 35,
        },
        responseId: "resp_123",
        name: "test",
      };

      const openAIResponse = toOpenAI(googleResponse);

      expect(openAIResponse.choices[0].message.content).toBe("The answer is 4.");
      expect(openAIResponse.choices[0].message.reasoning).toBe(
        "Let me think step by step..."
      );
      expect(openAIResponse.choices[0].message.reasoning_details).toHaveLength(1);
      expect(
        openAIResponse.choices[0].message.reasoning_details?.[0].thinking
      ).toBe("Let me think step by step...");
      expect(openAIResponse.usage.completion_tokens_details?.reasoning_tokens).toBe(
        10
      );
    });

    it("should handle multiple thinking parts", () => {
      const googleResponse = {
        candidates: [
          {
            content: {
              role: "model",
              parts: [
                { text: "First thought...", thought: true },
                { text: "Second thought...", thought: true },
                { text: "Final answer." },
              ],
            },
            finishReason: "STOP",
          },
        ],
        modelVersion: "gemini-3-pro",
        usageMetadata: {
          promptTokenCount: 5,
          candidatesTokenCount: 10,
          thoughtsTokenCount: 15,
          totalTokenCount: 30,
        },
        responseId: "resp_456",
        name: "test",
      };

      const openAIResponse = toOpenAI(googleResponse);

      expect(openAIResponse.choices[0].message.content).toBe("Final answer.");
      expect(openAIResponse.choices[0].message.reasoning).toBe(
        "First thought...Second thought..."
      );
      expect(openAIResponse.choices[0].message.reasoning_details).toHaveLength(2);
    });

    it("should not include reasoning when no thought parts exist", () => {
      const googleResponse = {
        candidates: [
          {
            content: {
              role: "model",
              parts: [{ text: "Simple response without thinking." }],
            },
            finishReason: "STOP",
          },
        ],
        modelVersion: "gemini-1.5-pro",
        usageMetadata: {
          promptTokenCount: 5,
          candidatesTokenCount: 5,
          totalTokenCount: 10,
        },
        responseId: "resp_789",
        name: "test",
      };

      const openAIResponse = toOpenAI(googleResponse);

      expect(openAIResponse.choices[0].message.content).toBe(
        "Simple response without thinking."
      );
      expect(openAIResponse.choices[0].message.reasoning).toBeUndefined();
      expect(openAIResponse.choices[0].message.reasoning_details).toBeUndefined();
    });
  });

  describe("Streaming Converter", () => {
    it("should emit reasoning delta for thought parts", () => {
      const converter = new GoogleToOpenAIStreamConverter();

      const event = {
        candidates: [
          {
            content: {
              parts: [{ text: "Thinking about this...", thought: true }],
            },
          },
        ],
        modelVersion: "gemini-2.5-flash",
      };

      const result = converter.convert(event as any);

      expect(result.length).toBeGreaterThan(0);

      const reasoningChunk = result.find(
        (chunk) => chunk.choices[0]?.delta?.reasoning !== undefined
      );
      expect(reasoningChunk).toBeDefined();
      expect(reasoningChunk?.choices[0].delta.reasoning).toBe(
        "Thinking about this..."
      );
    });

    it("should emit content delta for non-thought parts", () => {
      const converter = new GoogleToOpenAIStreamConverter();

      // First call to set sentInitial
      converter.convert({
        candidates: [{ content: { parts: [{ text: "Hello" }] } }],
        modelVersion: "gemini-1.5-pro",
      } as any);

      const event = {
        candidates: [
          {
            content: {
              parts: [{ text: "World" }],
            },
          },
        ],
        modelVersion: "gemini-1.5-pro",
      };

      const result = converter.convert(event as any);

      const contentChunk = result.find(
        (chunk) => chunk.choices[0]?.delta?.content === "World"
      );
      expect(contentChunk).toBeDefined();
    });

    it("should handle mixed thought and regular content in same response", () => {
      const converter = new GoogleToOpenAIStreamConverter();

      const event = {
        candidates: [
          {
            content: {
              parts: [
                { text: "Analyzing...", thought: true },
                { text: "The result is X." },
              ],
            },
          },
        ],
        modelVersion: "gemini-2.5-flash",
      };

      const result = converter.convert(event as any);

      const reasoningChunk = result.find(
        (chunk) => chunk.choices[0]?.delta?.reasoning !== undefined
      );
      const contentChunk = result.find(
        (chunk) => chunk.choices[0]?.delta?.content === "The result is X."
      );

      expect(reasoningChunk).toBeDefined();
      expect(contentChunk).toBeDefined();
    });
  });
});
