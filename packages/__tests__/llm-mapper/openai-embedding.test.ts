import { mapOpenAIEmbedding } from "../../llm-mapper/mappers/openai/embedding";

describe("OpenAI Embedding Mapper", () => {
  it("should map embedding request/response correctly", () => {
    const request = {
      model: "text-embedding-3-large",
      input: "GetPersonaByName needs error handling",
    };

    const response = {
      object: "list",
      data: [
        {
          object: "embedding",
          index: 0,
          embedding: [
            -0.01878975, -0.00018912303, 0.0156791, 0.023456, 0.034567,
          ],
        },
      ],
      model: "text-embedding-3-large",
      usage: {
        prompt_tokens: 19,
        total_tokens: 19,
      },
    };

    const result = mapOpenAIEmbedding({
      request,
      response,
      statusCode: 200,
      model: "text-embedding-3-large",
    });

    // Verify request
    expect(result.schema.request.model).toBe("text-embedding-3-large");
    expect(result.schema.request.input).toBe(
      "GetPersonaByName needs error handling"
    );
    expect(result.schema.request.messages?.[0].content).toBe(
      "GetPersonaByName needs error handling"
    );

    // Verify response
    expect(result.schema.response?.messages?.[0].content).toContain(
      "-0.018790, -0.000189"
    );

    // Verify preview
    expect(result.preview.request).toBe(
      "GetPersonaByName needs error handling"
    );
    expect(result.preview.response).toContain("-0.018790");
    expect(result.preview.concatenatedMessages).toHaveLength(2);
  });

  it("should handle error responses", () => {
    const request = {
      model: "text-embedding-3-large",
      input: "Test input",
    };

    const response = {
      error: {
        message: "Invalid API key",
      },
    };

    const result = mapOpenAIEmbedding({
      request,
      response,
      statusCode: 401,
      model: "text-embedding-3-large",
    });

    expect(result.preview.response).toBe("Invalid API key");
    expect(result.preview.request).toBe("Test input");
  });

  it("should handle array inputs", () => {
    const request = {
      model: "text-embedding-3-large",
      input: ["First input", "Second input"],
    };

    const response = {
      object: "list",
      data: [
        {
          object: "embedding",
          index: 0,
          embedding: [-0.01, -0.02, 0.03],
        },
        {
          object: "embedding",
          index: 1,
          embedding: [0.01, 0.02, -0.03],
        },
      ],
      model: "text-embedding-3-large",
    };

    const result = mapOpenAIEmbedding({
      request,
      response,
      statusCode: 200,
      model: "text-embedding-3-large",
    });

    expect(result.preview.request).toBe("First input\nSecond input");
    expect(result.schema.response?.messages).toHaveLength(2);
  });
});
