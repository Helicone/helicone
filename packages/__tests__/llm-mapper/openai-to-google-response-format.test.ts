import { describe, expect, it } from "@jest/globals";
import { toGoogle } from "../../llm-mapper/transform/providers/openai/request/toGoogle";

describe("toGoogle response_format transformation", () => {
  it("should convert response_format with json_schema to Google's responseMimeType and responseSchema", () => {
    const openAIRequest = {
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "user" as const,
          content: "Generate a JSON object with title and bullets fields",
        },
      ],
      response_format: {
        type: "json_schema" as const,
        json_schema: {
          name: "article",
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              bullets: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["title", "bullets"],
          },
        },
      },
    };

    const result = toGoogle(openAIRequest);

    // Should have generationConfig with responseMimeType and responseSchema
    expect(result.generationConfig).toBeDefined();
    expect(result.generationConfig?.responseMimeType).toBe("application/json");
    expect(result.generationConfig?.responseSchema).toBeDefined();
    expect(result.generationConfig?.responseSchema).toEqual({
      type: "object",
      properties: {
        title: { type: "string" },
        bullets: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["title", "bullets"],
    });
  });

  it("should convert response_format with type json_object to responseMimeType application/json", () => {
    const openAIRequest = {
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "user" as const,
          content: "Return a JSON object",
        },
      ],
      response_format: {
        type: "json_object" as const,
      },
    };

    const result = toGoogle(openAIRequest);

    expect(result.generationConfig).toBeDefined();
    expect(result.generationConfig?.responseMimeType).toBe("application/json");
    // No responseSchema since json_object doesn't provide one
    expect(result.generationConfig?.responseSchema).toBeUndefined();
  });

  it("should handle response_format with type text (default behavior)", () => {
    const openAIRequest = {
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "user" as const,
          content: "Just return plain text",
        },
      ],
      response_format: {
        type: "text" as const,
      },
    };

    const result = toGoogle(openAIRequest);

    // Should NOT set responseMimeType for text (default behavior)
    expect(result.generationConfig?.responseMimeType).toBeUndefined();
  });

  it("should strip additionalProperties from json_schema when converting", () => {
    const openAIRequest = {
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "user" as const,
          content: "Generate structured output",
        },
      ],
      response_format: {
        type: "json_schema" as const,
        json_schema: {
          name: "result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              nested: {
                type: "object",
                properties: {
                  value: { type: "number" },
                },
                additionalProperties: false,
              },
            },
            required: ["name"],
            additionalProperties: false,
          },
        },
      },
    };

    const result = toGoogle(openAIRequest);

    expect(result.generationConfig?.responseSchema).toBeDefined();
    // additionalProperties should be stripped
    expect(result.generationConfig?.responseSchema?.additionalProperties).toBeUndefined();
    expect(result.generationConfig?.responseSchema?.properties?.nested?.additionalProperties).toBeUndefined();
  });

  it("should handle Vercel AI SDK generateObject style request", () => {
    // This simulates what Vercel AI SDK sends for generateObject
    const openAIRequest = {
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "system" as const,
          content: "You are a helpful assistant that generates structured data.",
        },
        {
          role: "user" as const,
          content: "Generate an article about AI",
        },
      ],
      response_format: {
        type: "json_schema" as const,
        json_schema: {
          name: "article",
          schema: {
            type: "object",
            properties: {
              title: { type: "string", description: "The article title" },
              content: { type: "string", description: "The article content" },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Tags for the article",
              },
            },
            required: ["title", "content", "tags"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    };

    const result = toGoogle(openAIRequest);

    // Should properly convert to Google format
    expect(result.generationConfig).toBeDefined();
    expect(result.generationConfig?.responseMimeType).toBe("application/json");
    expect(result.generationConfig?.responseSchema).toBeDefined();

    // Schema should be present without additionalProperties
    expect(result.generationConfig?.responseSchema?.type).toBe("object");
    expect(result.generationConfig?.responseSchema?.properties?.title).toEqual({
      type: "string",
      description: "The article title",
    });
    expect(result.generationConfig?.responseSchema?.additionalProperties).toBeUndefined();
  });
});
