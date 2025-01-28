import { mapBlackForestLabsImage } from "../../llm-mapper/mappers/black-forest-labs/image";

describe("Black Forest Labs Image Mapper", () => {
  it("should map image request/response correctly", () => {
    const request = {
      prompt: "Dos",
      model: "black-forest-labs/FLUX.1-schnell",
      width: 1024,
      height: 768,
      steps: 3,
      response_format: "base64",
    };

    const response = {
      id: "908e349347460588-IAD",
      model: "black-forest-labs/FLUX.1-schnell",
      object: "list",
      data: [
        {
          timings: {
            inference: 0.22902374109253287,
          },
          index: 0,
          b64_json: "https://example.com/image.jpg",
        },
      ],
    };

    const result = mapBlackForestLabsImage({
      request,
      response,
      statusCode: 200,
      model: "black-forest-labs/FLUX.1-schnell",
    });

    // Verify request
    expect(result.schema.request.model).toBe(
      "black-forest-labs/FLUX.1-schnell"
    );
    expect(result.schema.request.prompt).toBe("Dos");
    expect(result.schema.request.messages?.[0].content).toBe("Dos");
    expect(result.schema.request.messages?.[0]._type).toBe("message");

    // Verify response
    expect(result.schema.response?.model).toBe(
      "black-forest-labs/FLUX.1-schnell"
    );
    expect(result.schema.response?.messages?.[0].content).toBe(
      "Image generated"
    );
    expect(result.schema.response?.messages?.[0]._type).toBe("image");
    expect(result.schema.response?.messages?.[0].image_url).toBe(
      "https://example.com/image.jpg"
    );

    // Verify preview
    expect(result.preview.request).toBe("Dos");
    expect(result.preview.response).toBe("Image generated successfully");
    expect(result.preview.concatenatedMessages).toHaveLength(2);
    expect(result.preview.concatenatedMessages[0].content).toBe("Dos");
    expect(result.preview.concatenatedMessages[1].image_url).toBe(
      "https://example.com/image.jpg"
    );
  });

  it("should handle error responses", () => {
    const request = {
      prompt: "Test input",
      model: "black-forest-labs/FLUX.1-schnell",
    };

    const response = {
      error: {
        message: "Invalid API key",
      },
    };

    const result = mapBlackForestLabsImage({
      request,
      response,
      statusCode: 401,
      model: "black-forest-labs/FLUX.1-schnell",
    });

    expect(result.preview.response).toBe("Invalid API key");
    expect(result.preview.request).toBe("Test input");
  });

  it("should handle missing prompt", () => {
    const request = {
      model: "black-forest-labs/FLUX.1-schnell",
    };

    const response = {
      id: "test-id",
      model: "black-forest-labs/FLUX.1-schnell",
      object: "list",
      data: [
        {
          index: 0,
          b64_json: "https://example.com/image.jpg",
        },
      ],
    };

    const result = mapBlackForestLabsImage({
      request,
      response,
      statusCode: 200,
      model: "black-forest-labs/FLUX.1-schnell",
    });

    expect(result.preview.request).toBe("");
    expect(result.preview.response).toBe("Image generated successfully");
    expect(result.preview.concatenatedMessages[0].content).toBe("");
  });
});
