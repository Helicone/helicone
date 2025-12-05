import { describe, expect, it } from "@jest/globals";
import { toGoogle } from "../../llm-mapper/transform/providers/openai/request/toGoogle";
import { toOpenAI } from "../../llm-mapper/transform/providers/google/response/toOpenai";
import { GoogleToOpenAIStreamConverter } from "../../llm-mapper/transform/providers/google/streamedResponse/toOpenai";
import { HeliconeChatCreateParams } from "../../prompts/types";

describe("Google Reasoning/Thinking Support", () => {
  describe("Request Mapper (toGoogle)", () => {
    it("should add thinkingConfig when reasoning_effort is provided", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "What is 2+2?" }],
        reasoning_effort: "high",
      };

      const googleRequest = toGoogle(openAIRequest);

      expect(googleRequest.generationConfig).toBeDefined();
      expect(googleRequest.generationConfig?.thinkingConfig).toBeDefined();
      expect(googleRequest.generationConfig?.thinkingConfig?.includeThoughts).toBe(true);
      expect(googleRequest.generationConfig?.thinkingConfig?.thinkingLevel).toBe("high");
      expect(googleRequest.generationConfig?.thinkingConfig?.thinkingBudget).toBe(-1); // Dynamic thinking
    });

    it("should map low reasoning_effort to low thinking level", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-3-pro",
        messages: [{ role: "user", content: "Simple question" }],
        reasoning_effort: "low",
      };

      const googleRequest = toGoogle(openAIRequest);

      expect(googleRequest.generationConfig?.thinkingConfig?.thinkingLevel).toBe("low");
    });

    it("should map medium reasoning_effort to low thinking level", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-3-pro",
        messages: [{ role: "user", content: "Medium complexity question" }],
        reasoning_effort: "medium",
      };

      const googleRequest = toGoogle(openAIRequest);

      // Medium maps to low since Google only supports low/high
      expect(googleRequest.generationConfig?.thinkingConfig?.thinkingLevel).toBe("low");
    });

    it("should use explicit budget_tokens from reasoning_options", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "Complex math problem" }],
        reasoning_effort: "high",
        reasoning_options: {
          budget_tokens: 2048,
        },
      };

      const googleRequest = toGoogle(openAIRequest);

      expect(googleRequest.generationConfig?.thinkingConfig?.thinkingBudget).toBe(2048);
    });

    it("should use explicit thinking_level from reasoning_options", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-3-pro",
        messages: [{ role: "user", content: "Question" }],
        reasoning_effort: "low", // This would normally map to low
        reasoning_options: {
          thinking_level: "high", // But explicit override to high
        },
      };

      const googleRequest = toGoogle(openAIRequest);

      expect(googleRequest.generationConfig?.thinkingConfig?.thinkingLevel).toBe("high");
    });

    it("should not add thinkingConfig when no reasoning parameters are provided", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-1.5-pro",
        messages: [{ role: "user", content: "Hello" }],
      };

      const googleRequest = toGoogle(openAIRequest);

      // Should not have thinkingConfig when no reasoning is requested
      expect(googleRequest.generationConfig?.thinkingConfig).toBeUndefined();
    });

    it("should enable thinking when only reasoning_options is provided without effort", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "Complex question" }],
        reasoning_options: {
          budget_tokens: 4096,
        },
      };

      const googleRequest = toGoogle(openAIRequest);

      expect(googleRequest.generationConfig?.thinkingConfig).toBeDefined();
      expect(googleRequest.generationConfig?.thinkingConfig?.includeThoughts).toBe(true);
      expect(googleRequest.generationConfig?.thinkingConfig?.thinkingBudget).toBe(4096);
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
      expect(openAIResponse.choices[0].message.reasoning).toBe("Let me think step by step...");
      expect(openAIResponse.choices[0].message.reasoning_details).toHaveLength(1);
      expect(openAIResponse.choices[0].message.reasoning_details?.[0].thinking).toBe(
        "Let me think step by step..."
      );
      expect(openAIResponse.usage.completion_tokens_details?.reasoning_tokens).toBe(10);
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
      expect(openAIResponse.choices[0].message.reasoning).toBe("First thought...Second thought...");
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

      expect(openAIResponse.choices[0].message.content).toBe("Simple response without thinking.");
      expect(openAIResponse.choices[0].message.reasoning).toBeUndefined();
      expect(openAIResponse.choices[0].message.reasoning_details).toBeUndefined();
    });
  });

  describe("Streaming Converter", () => {
    it("should emit reasoning delta for thought parts", () => {
      const converter = new GoogleToOpenAIStreamConverter();
      const chunks: any[] = [];

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

      // Should have initial role chunk and reasoning chunk
      expect(result.length).toBeGreaterThan(0);

      // Find the reasoning chunk
      const reasoningChunk = result.find(
        (chunk) => chunk.choices[0]?.delta?.reasoning !== undefined
      );
      expect(reasoningChunk).toBeDefined();
      expect(reasoningChunk?.choices[0].delta.reasoning).toBe("Thinking about this...");
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

      // Should have: initial role, reasoning delta, content delta
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
