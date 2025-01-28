import { describe, expect, it } from "@jest/globals";
import { mapDalleRequest } from "../../llm-mapper/mappers/openai/dalle";

describe("mapDalleRequest", () => {
  it("should handle successful image generation", () => {
    const result = mapDalleRequest({
      request: {
        prompt: "A beautiful image of a cat",
        model: "dall-e-3",
        quality: "standard",
        response_format: "b64_json",
        size: "1024x1024",
      },
      response: {
        created: 1737855727,
        data: [
          {
            b64_json: "iVB=",
            revised_prompt:
              "Render a detailed image of a majestic cat poised gracefully on a sun-dappled garden path...",
          },
        ],
      },
      statusCode: 200,
      model: "dall-e-3",
    });

    // Test request schema
    expect(result.schema.request).toEqual({
      model: "dall-e-3",
      prompt: "A beautiful image of a cat",
      quality: "standard",
      response_format: "b64_json",
      size: "1024x1024",
    });

    // Test response schema
    expect(result.schema.response!.messages![0]).toEqual({
      content:
        "Render a detailed image of a majestic cat poised gracefully on a sun-dappled garden path...",
      _type: "image",
      image_url: "iVB=",
    });

    // Test preview
    expect(result.preview.request).toBe("A beautiful image of a cat");
    expect(result.preview.response).toContain(
      "Render a detailed image of a majestic cat"
    );
    expect(result.preview.concatenatedMessages).toHaveLength(2);
    expect(result.preview.concatenatedMessages[0]).toEqual({
      content: "A beautiful image of a cat",
      role: "user",
      _type: "message",
    });
    expect(result.preview.concatenatedMessages[1]).toEqual({
      content:
        "Render a detailed image of a majestic cat poised gracefully on a sun-dappled garden path...",
      role: "assistant",
      _type: "image",
      image_url: "iVB=",
    });
  });

  it("should handle error responses", () => {
    const result = mapDalleRequest({
      request: {
        prompt: "Invalid prompt",
        model: "dall-e-3",
      },
      response: {
        error: {
          message: "Invalid prompt content",
        },
      },
      statusCode: 400,
      model: "dall-e-3",
    });

    // Test response text
    expect(result.preview.response).toBe("Invalid prompt content");
    expect(result.schema.response!.messages![0].content).toBe("");
  });

  it("should handle missing data", () => {
    const result = mapDalleRequest({
      request: {
        model: "dall-e-3",
      },
      response: {},
      statusCode: 200,
      model: "dall-e-3",
    });

    expect(result.preview.request).toBe("");
    expect(result.preview.response).toBe("");
    expect(result.schema.response!.messages![0]).toEqual({
      content: "",
      _type: "image",
      image_url: "",
    });
  });
});
