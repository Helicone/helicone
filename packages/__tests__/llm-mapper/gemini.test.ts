import { describe, expect, it } from "@jest/globals";
import { mapGeminiPro } from "../../llm-mapper/mappers/gemini/chat";
import { mapAnthropicRequest } from "../../llm-mapper/mappers/anthropic/chat";

describe("mapGeminiPro", () => {
  it("should handle basic text messages", () => {
    const result = mapGeminiPro({
      request: {
        contents: [
          {
            parts: [
              {
                text: "Hello, how are you?",
              },
            ],
            role: "user",
          },
        ],
        generationConfig: {},
      },
      response: {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "I'm doing well, thank you for asking!",
                },
              ],
              role: "model",
            },
          },
        ],
      },
      statusCode: 200,
      model: "gemini-1.5-pro",
    });

    expect(result.schema.request.messages![0]).toEqual({
      role: "user",
      content: "Hello, how are you?",
      _type: "message",
    });

    expect(result.schema.response!.messages![0]).toEqual({
      role: "model",
      content: "I'm doing well, thank you for asking!",
      _type: "message",
    });
  });

  it("should handle image messages", () => {
    const imageData = "iVBORw0KGgoAAAANS...=";
    const result = mapGeminiPro({
      request: {
        contents: [
          {
            parts: [
              {
                text: "What's in this image?",
              },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: imageData,
                },
              },
            ],
            role: "user",
          },
        ],
        generationConfig: {},
      },
      response: {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "That's a screenshot of a file explorer or IDE displaying the contents of a project directory...",
                },
              ],
              role: "model",
            },
            finishReason: 1,
            avgLogprobs: -0.41642069079212307,
          },
        ],
        usageMetadata: {
          promptTokenCount: 266,
          candidatesTokenCount: 194,
          totalTokenCount: 460,
        },
      },
      statusCode: 200,
      model: "gemini-1.5-flash",
    });

    // Test request message handling
    expect(result.schema.request.messages![0]).toEqual({
      role: "user",
      content: "What's in this image?",
      _type: "image",
      image_url: imageData,
    });

    // Test response message handling
    expect(result.schema.response!.messages![0]).toEqual({
      role: "model",
      content:
        "That's a screenshot of a file explorer or IDE displaying the contents of a project directory...",
      _type: "message",
    });

    // Test preview
    expect(result.preview.request).toBe("What's in this image?");
    expect(result.preview.response).toContain(
      "That's a screenshot of a file explorer"
    );
  });

  it("should handle error responses", () => {
    const result = mapGeminiPro({
      request: {
        contents: [
          {
            parts: [{ text: "Hello" }],
            role: "user",
          },
        ],
      },
      response: {
        error: {
          message: "Invalid request",
          code: 400,
        },
      },
      statusCode: 400,
      model: "gemini-1.5-pro",
    });

    expect(result.schema.response!.error).toEqual({
      heliconeMessage: {
        message: "Invalid request",
        code: 400,
      },
    });
  });

  it("should extract model from modelVersion when model is unknown", () => {
    const result = mapGeminiPro({
      request: {
        contents: [
          {
            parts: [
              {
                text: "List 3 classic sci-fi movies from the 1980s.",
              },
            ],
            role: "user",
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      },
      response: {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '{"movies":[{"title":"Blade Runner","year":1982,"director":"Ridley Scott","rating":8.1}]}',
                },
              ],
              role: "model",
            },
          },
        ],
        modelVersion: "gemini-2.0-flash",
      },
      statusCode: 200,
      model: "unknown",
    });

    expect(result.schema.request.model).toBe("gemini-2.0-flash");
    expect(result.schema.response?.model).toBe("gemini-2.0-flash");
  });
});
