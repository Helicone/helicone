import { describe, expect, it } from "@jest/globals";
import { toGoogle } from "../../llm-mapper/transform/providers/openai/request/toGoogle";

describe("toGoogle tool transformation", () => {
  it("should strip additionalProperties from tool parameters", () => {
    const openAIRequest = {
      model: "gemini-1.5-pro",
      messages: [
        {
          role: "user" as const,
          content: "What's the weather in San Francisco?",
        },
      ],
      tools: [
        {
          type: "function" as const,
          function: {
            name: "get_weather",
            description: "Get the current weather",
            strict: true,
            parameters: {
              type: "object",
              properties: {
                location: { type: "string" },
                unit: { type: "string", enum: ["celsius", "fahrenheit"] },
              },
              required: ["location"],
              additionalProperties: false,
            },
          },
        },
      ],
    };

    const result = toGoogle(openAIRequest);

    expect(result.tools).toBeDefined();
    expect(result.tools![0].functionDeclarations).toBeDefined();
    const funcDecl = result.tools![0].functionDeclarations![0];

    expect(funcDecl.name).toBe("get_weather");
    expect(funcDecl.parameters).toBeDefined();
    expect(funcDecl.parameters!.additionalProperties).toBeUndefined();
    expect(funcDecl.parameters!.properties).toEqual({
      location: { type: "string" },
      unit: { type: "string", enum: ["celsius", "fahrenheit"] },
    });
  });

  it("should recursively strip additionalProperties from nested object properties", () => {
    const openAIRequest = {
      model: "gemini-1.5-pro",
      messages: [
        {
          role: "user" as const,
          content: "Get weather details",
        },
      ],
      tools: [
        {
          type: "function" as const,
          function: {
            name: "get_weather",
            description: "Get weather with nested config",
            parameters: {
              type: "object",
              properties: {
                location: {
                  type: "object",
                  properties: {
                    city: { type: "string" },
                    country: { type: "string" },
                  },
                  additionalProperties: false,
                },
                options: {
                  type: "object",
                  properties: {
                    units: { type: "string" },
                    includeForecast: { type: "boolean" },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
          },
        },
      ],
    };

    const result = toGoogle(openAIRequest);
    const funcDecl = result.tools![0].functionDeclarations![0];
    const params = funcDecl.parameters!;

    // Top level should not have additionalProperties
    expect(params.additionalProperties).toBeUndefined();

    // Nested properties should also not have additionalProperties
    expect(params.properties!.location.additionalProperties).toBeUndefined();
    expect(params.properties!.options.additionalProperties).toBeUndefined();

    // But should preserve other fields
    expect(params.properties!.location.properties).toBeDefined();
    expect(params.properties!.options.properties).toBeDefined();
  });

  it("should strip additionalProperties from array items", () => {
    const openAIRequest = {
      model: "gemini-1.5-pro",
      messages: [
        {
          role: "user" as const,
          content: "Search for hotels",
        },
      ],
      tools: [
        {
          type: "function" as const,
          function: {
            name: "search_hotels",
            description: "Search for hotels",
            parameters: {
              type: "object",
              properties: {
                filters: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      field: { type: "string" },
                      value: { type: "string" },
                    },
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
          },
        },
      ],
    };

    const result = toGoogle(openAIRequest);
    const funcDecl = result.tools![0].functionDeclarations![0];
    const params = funcDecl.parameters!;

    expect(params.additionalProperties).toBeUndefined();
    expect(params.properties!.filters.items.additionalProperties).toBeUndefined();
    expect(params.properties!.filters.items.properties).toBeDefined();
  });

  it("should handle tools without parameters gracefully", () => {
    const openAIRequest = {
      model: "gemini-1.5-pro",
      messages: [
        {
          role: "user" as const,
          content: "Get time",
        },
      ],
      tools: [
        {
          type: "function" as const,
          function: {
            name: "get_current_time",
            description: "Get the current time",
          },
        },
      ],
    };

    const result = toGoogle(openAIRequest);

    expect(result.tools).toBeDefined();
    expect(result.tools![0].functionDeclarations![0].name).toBe("get_current_time");
    expect(result.tools![0].functionDeclarations![0].parameters).toBeUndefined();
  });

  it("should strip additionalProperties from allOf/anyOf/oneOf schemas", () => {
    const openAIRequest = {
      model: "gemini-1.5-pro",
      messages: [
        {
          role: "user" as const,
          content: "Create item",
        },
      ],
      tools: [
        {
          type: "function" as const,
          function: {
            name: "create_item",
            description: "Create an item",
            parameters: {
              type: "object",
              properties: {
                item: {
                  oneOf: [
                    {
                      type: "object",
                      properties: { name: { type: "string" } },
                      additionalProperties: false,
                    },
                    {
                      type: "object",
                      properties: { id: { type: "number" } },
                      additionalProperties: false,
                    },
                  ],
                },
              },
              additionalProperties: false,
            },
          },
        },
      ],
    };

    const result = toGoogle(openAIRequest);
    const funcDecl = result.tools![0].functionDeclarations![0];
    const params = funcDecl.parameters!;

    expect(params.additionalProperties).toBeUndefined();
    expect(params.properties!.item.oneOf[0].additionalProperties).toBeUndefined();
    expect(params.properties!.item.oneOf[1].additionalProperties).toBeUndefined();
  });
});
