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

    it("should default to 'low' reasoning_effort when not specified for Gemini 3 models", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-3-pro-preview",
        messages: [{ role: "user", content: "What is 2+2?" }],
        // No reasoning_effort specified - should default to "low" ONLY for Gemini 3+
      };

      const googleRequest = toGoogle(openAIRequest);

      // Default "low" effort maps to "low" thinkingLevel for Google
      expect(googleRequest.generationConfig?.thinkingConfig).toEqual({
        includeThoughts: true,
        thinkingLevel: "low",
      });
    });

    it("should disable thinking by default for Gemini 2.5 models when reasoning_effort not specified", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "Test" }],
        // No reasoning_effort specified - Gemini 2.5 requires explicit opt-in
      };

      const googleRequest = toGoogle(openAIRequest);

      // Gemini 2.5 models don't get thinking enabled by default
      expect(googleRequest.generationConfig?.thinkingConfig).toEqual({
        thinkingBudget: 0,
      });
    });

    it("should disable thinking by default for Gemini 1.5 and older models", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-1.5-pro",
        messages: [{ role: "user", content: "Hello" }],
        // No reasoning_effort specified - should disable thinking for older models
      };

      const googleRequest = toGoogle(openAIRequest);

      // Older models don't get thinking enabled by default
      expect(googleRequest.generationConfig?.thinkingConfig).toEqual({
        thinkingBudget: 0,
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

    it("should preserve thoughtSignature in reasoning_details", () => {
      // Google puts thoughtSignature on the content part, not the thought part
      const googleResponse = {
        candidates: [
          {
            content: {
              role: "model",
              parts: [
                {
                  text: "Let me think about this...",
                  thought: true,
                },
                {
                  text: "The answer is 42.",
                  thoughtSignature: "EoaoSgqCqEoBcsjafFAvhG123456",
                },
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
        responseId: "resp_sig_1",
        name: "test",
      };

      const openAIResponse = toOpenAI(googleResponse);

      expect(openAIResponse.choices[0].message.content).toBe("The answer is 42.");
      expect(openAIResponse.choices[0].message.reasoning).toBe(
        "Let me think about this..."
      );
      expect(openAIResponse.choices[0].message.reasoning_details).toHaveLength(1);
      expect(
        openAIResponse.choices[0].message.reasoning_details?.[0].thinking
      ).toBe("Let me think about this...");
      expect(
        openAIResponse.choices[0].message.reasoning_details?.[0].signature
      ).toBe("EoaoSgqCqEoBcsjafFAvhG123456");
    });

    it("should handle multiple thinking parts with single signature", () => {
      // Google provides a single signature for all thinking content
      // The same signature should be applied to ALL reasoning_details
      const googleResponse = {
        candidates: [
          {
            content: {
              role: "model",
              parts: [
                {
                  text: "First thought...",
                  thought: true,
                },
                {
                  text: "Second thought...",
                  thought: true,
                },
                {
                  text: "Final answer.",
                  thoughtSignature: "combined_signature_xyz",
                },
              ],
            },
            finishReason: "STOP",
          },
        ],
        modelVersion: "gemini-2.5-flash",
        usageMetadata: {
          promptTokenCount: 5,
          candidatesTokenCount: 10,
          thoughtsTokenCount: 15,
          totalTokenCount: 30,
        },
        responseId: "resp_sig_2",
        name: "test",
      };

      const openAIResponse = toOpenAI(googleResponse);

      expect(openAIResponse.choices[0].message.reasoning_details).toHaveLength(2);
      // ALL thinking blocks should have the same signature
      expect(
        openAIResponse.choices[0].message.reasoning_details?.[0].signature
      ).toBe("combined_signature_xyz");
      expect(
        openAIResponse.choices[0].message.reasoning_details?.[1].signature
      ).toBe("combined_signature_xyz");
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

    it("should emit reasoning_details with thoughtSignature on finish", () => {
      const converter = new GoogleToOpenAIStreamConverter();

      // First event with thinking content (no signature on thought part)
      const event1 = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "Thinking about the problem...",
                  thought: true,
                },
              ],
            },
          },
        ],
        modelVersion: "gemini-2.5-flash",
      };

      // Second event with regular content
      const event2 = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "The answer is 42.",
                },
              ],
            },
          },
        ],
        modelVersion: "gemini-2.5-flash",
      };

      // Third event with empty text and signature + finish (Google's actual format)
      const event3 = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "",
                  thoughtSignature: "sig_streaming_123",
                },
              ],
            },
            finishReason: "STOP",
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 15,
          totalTokenCount: 25,
        },
        modelVersion: "gemini-2.5-flash",
      };

      converter.convert(event1 as any);
      converter.convert(event2 as any);
      const result3 = converter.convert(event3 as any);

      // Find the finish chunk with reasoning_details
      const finishChunk = result3.find(
        (chunk) => chunk.choices[0]?.finish_reason === "stop"
      );

      expect(finishChunk).toBeDefined();
      expect(finishChunk?.choices[0]?.delta?.reasoning_details).toBeDefined();
      expect(finishChunk?.choices[0]?.delta?.reasoning_details).toHaveLength(1);
      expect(
        finishChunk?.choices[0]?.delta?.reasoning_details?.[0].thinking
      ).toBe("Thinking about the problem...");
      expect(
        finishChunk?.choices[0]?.delta?.reasoning_details?.[0].signature
      ).toBe("sig_streaming_123");
    });

    it("should handle multiple thinking blocks with signature on final empty-text chunk (real Google format)", () => {
      const converter = new GoogleToOpenAIStreamConverter();

      // Event 1: First thinking block
      const event1 = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "**Analyzing Joke Requirements**\n\nI've been dissecting the request, pinpointing the key ingredients: a joke, brevity being paramount, and the obvious goal of generating laughter. Now I'm shifting to brainstorming suitable categories for these short jokes.\n\n\n",
                  thought: true,
                },
              ],
              role: "model",
            },
            index: 0,
          },
        ],
        usageMetadata: {
          promptTokenCount: 23,
          totalTokenCount: 23,
          promptTokensDetails: [{ modality: "TEXT", tokenCount: 23 }],
        },
        modelVersion: "gemini-3-pro-preview",
        responseId: "hdg8afaKJoyn_uMP_J_D4Ak",
      };

      // Event 2: Second thinking block
      const event2 = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "**Exploring Joke Types**\n\nI'm now focusing on different types of jokes that fit the brief. Puns are a strong contender; they're short and effective. Anti-jokes are interesting, though the context might add some length. Classic setup/punchline jokes, like the \"Why did the...\" style, are also on the table for their brevity and established format.\n\n\n",
                  thought: true,
                },
              ],
              role: "model",
            },
            index: 0,
          },
        ],
        usageMetadata: {
          promptTokenCount: 23,
          totalTokenCount: 23,
          promptTokensDetails: [{ modality: "TEXT", tokenCount: 23 }],
        },
        modelVersion: "gemini-3-pro-preview",
        responseId: "hdg8afaKJoyn_uMP_J_D4Ak",
      };

      // Event 3: Content (the actual joke)
      const event3 = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "I threw a boomerang a few years ago. I now live in constant fear.",
                },
              ],
              role: "model",
            },
            index: 0,
          },
        ],
        usageMetadata: {
          promptTokenCount: 23,
          candidatesTokenCount: 16,
          totalTokenCount: 161,
          promptTokensDetails: [{ modality: "TEXT", tokenCount: 23 }],
          thoughtsTokenCount: 122,
        },
        modelVersion: "gemini-3-pro-preview",
        responseId: "hdg8afaKJoyn_uMP_J_D4Ak",
      };

      // Event 4: Final chunk with empty text, thoughtSignature, and finishReason
      const event4 = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "",
                  thoughtSignature:
                    "ErIECq8EAXLI2nxYfUMo5r6zgPuzMN4AvtzcJgkh468L48SHfeC7YmDPxQqI/rl/Y1MlWljgxiMuGnLG+Xd/zyv+8IqiyGKzi/BMyheXcAtu+TNF4OCJcGOZBALBhWUJ0awcSFEx0X9Emh/c2O4Krgfvo3pV77CH3lTar9d8+H6xwaUQSNBRr7yAHz07zMDAC82f68HF3US+oKnFBBZhq7QbuQwCFULDOhRHN1y9i/Se7lD7G2/8Ccs8dblyKOu5XG1VZ3lA",
                },
              ],
              role: "model",
            },
            finishReason: "STOP",
            index: 0,
          },
        ],
        usageMetadata: {
          promptTokenCount: 23,
          candidatesTokenCount: 16,
          totalTokenCount: 161,
          promptTokensDetails: [{ modality: "TEXT", tokenCount: 23 }],
          thoughtsTokenCount: 122,
        },
        modelVersion: "gemini-3-pro-preview",
        responseId: "hdg8afaKJoyn_uMP_J_D4Ak",
      };

      // Process all events
      const result1 = converter.convert(event1 as any);
      const result2 = converter.convert(event2 as any);
      const result3 = converter.convert(event3 as any);
      const result4 = converter.convert(event4 as any);

      // Verify reasoning chunks were emitted
      const reasoningChunk1 = result1.find(
        (chunk) => chunk.choices[0]?.delta?.reasoning !== undefined
      );
      const reasoningChunk2 = result2.find(
        (chunk) => chunk.choices[0]?.delta?.reasoning !== undefined
      );
      const contentChunk = result3.find(
        (chunk) => chunk.choices[0]?.delta?.content !== undefined
      );

      expect(reasoningChunk1).toBeDefined();
      expect(reasoningChunk1?.choices[0].delta.reasoning).toContain(
        "**Analyzing Joke Requirements**"
      );

      expect(reasoningChunk2).toBeDefined();
      expect(reasoningChunk2?.choices[0].delta.reasoning).toContain(
        "**Exploring Joke Types**"
      );

      expect(contentChunk).toBeDefined();
      expect(contentChunk?.choices[0].delta.content).toBe(
        "I threw a boomerang a few years ago. I now live in constant fear."
      );

      // Find the finish chunk with reasoning_details
      const finishChunk = result4.find(
        (chunk) => chunk.choices[0]?.finish_reason === "stop"
      );

      expect(finishChunk).toBeDefined();
      expect(finishChunk?.choices[0]?.delta?.reasoning_details).toBeDefined();
      expect(finishChunk?.choices[0]?.delta?.reasoning_details).toHaveLength(2);

      // Both thinking blocks should have the SAME signature
      expect(
        finishChunk?.choices[0]?.delta?.reasoning_details?.[0].thinking
      ).toContain("**Analyzing Joke Requirements**");
      expect(
        finishChunk?.choices[0]?.delta?.reasoning_details?.[0].signature
      ).toBe(
        "ErIECq8EAXLI2nxYfUMo5r6zgPuzMN4AvtzcJgkh468L48SHfeC7YmDPxQqI/rl/Y1MlWljgxiMuGnLG+Xd/zyv+8IqiyGKzi/BMyheXcAtu+TNF4OCJcGOZBALBhWUJ0awcSFEx0X9Emh/c2O4Krgfvo3pV77CH3lTar9d8+H6xwaUQSNBRr7yAHz07zMDAC82f68HF3US+oKnFBBZhq7QbuQwCFULDOhRHN1y9i/Se7lD7G2/8Ccs8dblyKOu5XG1VZ3lA"
      );

      expect(
        finishChunk?.choices[0]?.delta?.reasoning_details?.[1].thinking
      ).toContain("**Exploring Joke Types**");
      expect(
        finishChunk?.choices[0]?.delta?.reasoning_details?.[1].signature
      ).toBe(
        "ErIECq8EAXLI2nxYfUMo5r6zgPuzMN4AvtzcJgkh468L48SHfeC7YmDPxQqI/rl/Y1MlWljgxiMuGnLG+Xd/zyv+8IqiyGKzi/BMyheXcAtu+TNF4OCJcGOZBALBhWUJ0awcSFEx0X9Emh/c2O4Krgfvo3pV77CH3lTar9d8+H6xwaUQSNBRr7yAHz07zMDAC82f68HF3US+oKnFBBZhq7QbuQwCFULDOhRHN1y9i/Se7lD7G2/8Ccs8dblyKOu5XG1VZ3lA"
      );
    });

    it("should capture signature even when thoughtSignature comes with empty string text", () => {
      const converter = new GoogleToOpenAIStreamConverter();

      // Single thinking event
      const event1 = {
        candidates: [
          {
            content: {
              parts: [{ text: "Let me think...", thought: true }],
              role: "model",
            },
            index: 0,
          },
        ],
        modelVersion: "gemini-3-pro-preview",
      };

      // Final event: empty string text with signature (this is the key case!)
      const event2 = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "", // Empty string - falsy in JS!
                  thoughtSignature: "test_signature_abc123",
                },
              ],
              role: "model",
            },
            finishReason: "STOP",
            index: 0,
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
        modelVersion: "gemini-3-pro-preview",
      };

      converter.convert(event1 as any);
      const result2 = converter.convert(event2 as any);

      const finishChunk = result2.find(
        (chunk) => chunk.choices[0]?.finish_reason === "stop"
      );

      expect(finishChunk).toBeDefined();
      expect(finishChunk?.choices[0]?.delta?.reasoning_details).toHaveLength(1);
      expect(
        finishChunk?.choices[0]?.delta?.reasoning_details?.[0].signature
      ).toBe("test_signature_abc123");
    });
  });

  describe("Request Mapper (toGoogle) - Multi-turn with reasoning_details", () => {
    it("should convert reasoning_details to thinking parts with thoughtSignature", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-2.5-flash",
        messages: [
          { role: "user", content: "What is 2+2?" },
          {
            role: "assistant",
            content: "The answer is 4.",
            reasoning_details: [
              {
                thinking: "Let me calculate 2+2...",
                signature: "sig_from_previous_response",
              },
            ],
          } as any,
          { role: "user", content: "What about 3+3?" },
        ],
      };

      const googleRequest = toGoogle(openAIRequest);

      // Find the assistant message (model role)
      const modelContent = googleRequest.contents.find(
        (c) => c.role === "model"
      );
      expect(modelContent).toBeDefined();
      expect(modelContent?.parts).toHaveLength(2);

      // First part should be the thinking part with signature
      const thinkingPart = modelContent?.parts[0];
      expect(thinkingPart?.text).toBe("Let me calculate 2+2...");
      expect(thinkingPart?.thought).toBe(true);
      expect(thinkingPart?.thoughtSignature).toBe("sig_from_previous_response");

      // Second part should be the regular content
      const contentPart = modelContent?.parts[1];
      expect(contentPart?.text).toBe("The answer is 4.");
      expect(contentPart?.thought).toBeUndefined();
    });

    it("should handle multiple reasoning_details with signatures", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-2.5-flash",
        messages: [
          { role: "user", content: "Solve this complex problem" },
          {
            role: "assistant",
            content: "Here is the solution.",
            reasoning_details: [
              { thinking: "First step...", signature: "sig_1" },
              { thinking: "Second step...", signature: "sig_2" },
            ],
          } as any,
          { role: "user", content: "Can you explain more?" },
        ],
      };

      const googleRequest = toGoogle(openAIRequest);

      const modelContent = googleRequest.contents.find(
        (c) => c.role === "model"
      );
      expect(modelContent?.parts).toHaveLength(3);

      // First two parts should be thinking parts
      expect(modelContent?.parts[0]?.thought).toBe(true);
      expect(modelContent?.parts[0]?.thoughtSignature).toBe("sig_1");
      expect(modelContent?.parts[1]?.thought).toBe(true);
      expect(modelContent?.parts[1]?.thoughtSignature).toBe("sig_2");

      // Third part should be regular content
      expect(modelContent?.parts[2]?.text).toBe("Here is the solution.");
    });

    it("should handle reasoning_details without signatures (empty string)", () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: "gemini-2.5-flash",
        messages: [
          { role: "user", content: "Hello" },
          {
            role: "assistant",
            content: "Hi there!",
            reasoning_details: [{ thinking: "Greeting the user...", signature: "" }],
          } as any,
          { role: "user", content: "How are you?" },
        ],
      };

      const googleRequest = toGoogle(openAIRequest);

      const modelContent = googleRequest.contents.find(
        (c) => c.role === "model"
      );
      expect(modelContent?.parts).toHaveLength(2);

      // Thinking part should exist but without thoughtSignature (since it's empty)
      expect(modelContent?.parts[0]?.thought).toBe(true);
      expect(modelContent?.parts[0]?.thoughtSignature).toBeUndefined();
    });
  });
});
