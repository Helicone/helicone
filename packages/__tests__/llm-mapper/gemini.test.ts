import { describe, expect, it } from "@jest/globals";
import { mapGeminiPro } from "../../llm-mapper/mappers/gemini/chat";
import { mapAnthropicRequest } from "../../llm-mapper/mappers/anthropic/chat";
import { Message } from "@/llm-mapper/types";

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
      contentArray: [
        {
          _type: "message",
          content: "What's in this image?",
          role: "user",
        },
        {
          _type: "image",
          image_url: `data:image/png;base64,${imageData}`,
          role: "user",
        },
      ],
      _type: "contentArray",
    } as Message);

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

  it("should handle image responses (inlineData in response)", () => {
    const result = mapGeminiPro({
      request: {
        contents: [
          {
            parts: [{ text: "Draw a yellow star" }],
            role: "user",
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      },
      response: {
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: "test_base64_image_data",
                  },
                },
              ],
              role: "model",
            },
          },
        ],
        modelVersion: "gemini-3-pro-image-preview",
      },
      statusCode: 200,
      model: "gemini-3-pro-image-preview",
    });

    // Test response contains image
    expect(result.schema.response!.messages![0]).toEqual({
      _type: "image",
      role: "model",
      mime_type: "image/jpeg",
      image_url: "data:image/jpeg;base64,test_base64_image_data",
    });
  });

  it("should handle mixed text + image responses", () => {
    const result = mapGeminiPro({
      request: {
        contents: [
          {
            parts: [{ text: "Draw a cat and describe it" }],
            role: "user",
          },
        ],
      },
      response: {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "Here is a cute cat:",
                },
                {
                  inlineData: {
                    mimeType: "image/png",
                    data: "cat_image_base64",
                  },
                },
              ],
              role: "model",
            },
          },
        ],
        modelVersion: "gemini-2.0-flash-exp",
      },
      statusCode: 200,
      model: "gemini-2.0-flash-exp",
    });

    // Test response contains contentArray with text and image
    expect(result.schema.response!.messages![0]).toEqual({
      _type: "contentArray",
      role: "model",
      contentArray: [
        {
          _type: "message",
          role: "model",
          content: "Here is a cute cat:",
        },
        {
          _type: "image",
          role: "model",
          mime_type: "image/png",
          image_url: "data:image/png;base64,cat_image_base64",
        },
      ],
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
