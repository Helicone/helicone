import { describe, expect, it } from "@jest/globals";
import { toGoogle } from "../../llm-mapper/transform/providers/openai/request/toGoogle";

describe("toGoogle cachedContent transformation", () => {
  it("should forward cachedContent parameter for Vertex AI format", () => {
    const openAIRequest = {
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "user" as const,
          content: "Analyze the data in the cache.",
        },
      ],
      cachedContent: "projects/my-project/locations/us-central1/cachedContents/abc123",
    };

    const result = toGoogle(openAIRequest as any);

    expect(result.cachedContent).toBe(
      "projects/my-project/locations/us-central1/cachedContents/abc123"
    );
    expect(result.contents).toHaveLength(1);
  });

  it("should forward cachedContent parameter for Google AI Studio format", () => {
    const openAIRequest = {
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "user" as const,
          content: "Summarize the cached document.",
        },
      ],
      cachedContent: "cachedContents/xyz789",
    };

    const result = toGoogle(openAIRequest as any);

    expect(result.cachedContent).toBe("cachedContents/xyz789");
  });

  it("should not include cachedContent when not provided", () => {
    const openAIRequest = {
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "user" as const,
          content: "Hello world",
        },
      ],
    };

    const result = toGoogle(openAIRequest);

    expect(result.cachedContent).toBeUndefined();
  });

  it("should not include cachedContent when empty string", () => {
    const openAIRequest = {
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "user" as const,
          content: "Hello world",
        },
      ],
      cachedContent: "",
    };

    const result = toGoogle(openAIRequest as any);

    expect(result.cachedContent).toBeUndefined();
  });

  it("should work with cachedContent and other parameters", () => {
    const openAIRequest = {
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "system" as const,
          content: "You are a helpful assistant.",
        },
        {
          role: "user" as const,
          content: "What's in the cached content?",
        },
      ],
      cachedContent: "projects/test/locations/us-central1/cachedContents/test123",
      temperature: 0.7,
      max_tokens: 1024,
    };

    const result = toGoogle(openAIRequest as any);

    expect(result.cachedContent).toBe(
      "projects/test/locations/us-central1/cachedContents/test123"
    );
    expect(result.system_instruction).toBeDefined();
    expect(result.generationConfig?.temperature).toBe(0.7);
    expect(result.generationConfig?.maxOutputTokens).toBe(1024);
    expect(result.contents).toHaveLength(1); // Only user message, system is separate
  });
});
