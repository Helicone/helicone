import { describe, expect, it } from "@jest/globals";
import { mapAnthropicRequest } from "../../llm-mapper/mappers/anthropic/chat";

describe("mapAnthropicRequest", () => {
  it("should correctly map Claude 3 response", () => {
    const model = "claude-3-opus-20240229";
    const request = {
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: "Count to 5",
        },
      ],
      model,
    };

    const response = {
      id: "msg_01RxjAu72Tj29qTXerxpqRu5",
      type: "message",
      role: "assistant",
      model,
      content: [
        {
          type: "text",
          text: "1\n2\n3\n4\n5",
        },
      ],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: {
        input_tokens: 11,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        output_tokens: 13,
      },
    };

    const result = mapAnthropicRequest({
      request,
      response,
      statusCode: 200,
      model,
    });

    // Test schema structure
    expect(result.schema.request).toEqual({
      messages: [
        {
          content: "Count to 5",
          role: "user",
          _type: "message",
        },
      ],
      tool_choice: undefined,
      max_tokens: 1000,
      model,
    });

    expect(result.schema.response).toEqual({
      messages: [
        {
          content: "1\n2\n3\n4\n5",
          role: "assistant",
          _type: "message",
          id: expect.any(String),
        },
      ],
      model,
    });

    // Test preview
    expect(result.preview).toEqual({
      request: "Count to 5",
      response: "1\n2\n3\n4\n5",
      concatenatedMessages: [
        {
          content: "Count to 5",
          role: "user",
          _type: "message",
        },
        {
          content: "1\n2\n3\n4\n5",
          role: "assistant",
          _type: "message",
          id: expect.any(String),
        },
      ],
    });
  });

  it("should correctly map Claude 3 response with messages in schema", () => {
    const result = mapAnthropicRequest({
      request: {
        max_tokens: 1000,
        model: "claude-3-opus-20240229",
        messages: [
          {
            content: "Count to 5",
            role: "user",
          },
        ],
      },
      response: {
        id: "msg_123",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "1\n2\n3\n4\n5",
          },
        ],
        model: "claude-3-opus-20240229",
      },
      statusCode: 200,
      model: "claude-3-opus-20240229",
    });

    expect(result.schema.response!.messages).toBeDefined();
    expect(result.schema.response!.messages).toHaveLength(1);
    expect(result.schema.response!.messages![0]).toEqual({
      id: expect.any(String),
      content: "1\n2\n3\n4\n5",
      role: "assistant",
      _type: "message",
    });
    expect(result.schema.response!.model).toBe("claude-3-opus-20240229");
  });

  it("should handle error responses", () => {
    const model = "claude-3-opus-20240229";
    const request = {
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: "Count to 5",
        },
      ],
      model,
    };

    const response = {
      error: {
        message: "Test error message",
      },
    };

    const result = mapAnthropicRequest({
      request,
      response,
      statusCode: 400,
      model,
    });

    expect(result.schema.response).toEqual({
      error: {
        heliconeMessage: JSON.stringify(response.error),
      },
    });

    expect(result.preview.response).toBe("Test error message");
  });

  it("should handle image messages", () => {
    const model = "claude-3-opus-20240229";
    const imageUrl = "http://example.com/image.png";
    const result = mapAnthropicRequest({
      request: {
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/png",
                  data: imageUrl,
                },
              },
              {
                type: "text",
                text: "What's in this image?",
              },
            ],
          },
        ],
        model,
      },
      response: {
        id: "msg_123",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "The image shows a test image.",
          },
        ],
        model,
      },
      statusCode: 200,
      model,
    });

    // Test request message handling
    expect(result.schema.request.messages![0]).toEqual({
      content: "What's in this image?",
      role: "user",
      _type: "image",
      image_url: imageUrl,
    });

    // Test response message handling
    expect(result.schema.response!.messages![0]).toEqual({
      id: expect.any(String),
      content: "The image shows a test image.",
      role: "assistant",
      _type: "message",
    });

    // Test preview
    expect(result.preview.request).toContain("What's in this image?");
    expect(result.preview.response).toBe("The image shows a test image.");
  });

  it("should handle tool use and thinking messages", () => {
    const model = "claude-3-5-sonnet-20241022";
    const result = mapAnthropicRequest({
      request: {
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: "What's the weather like in San Francisco?",
          },
          {
            role: "assistant",
            content: [
              {
                type: "text",
                text: "<thinking>I need to use get_weather, and the user wants SF, which is likely San Francisco, CA.</thinking>",
              },
              {
                type: "tool_use",
                id: "toolu_01A09q90qw90lq917835lq9",
                name: "get_weather",
                input: {
                  location: "San Francisco, CA",
                  unit: "celsius",
                },
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: "toolu_01A09q90qw90lq917835lq9",
                content: "65 degrees",
              },
            ],
          },
        ],
        model,
        tools: [
          {
            name: "get_weather",
            description: "Get the current weather in a given location",
            input_schema: {
              type: "object",
              properties: {
                location: {
                  type: "string",
                  description: "The city and state, e.g. San Francisco, CA",
                },
                unit: {
                  type: "string",
                  enum: ["celsius", "fahrenheit"],
                  description:
                    "The unit of temperature, either 'celsius' or 'fahrenheit'",
                },
              },
              required: ["location"],
            },
          },
        ],
      },
      response: {
        id: "msg_01MCBxUvRAtMJ5Pfq9Tegqus",
        type: "message",
        role: "assistant",
        model,
        content: [
          {
            type: "text",
            text: "The current temperature in San Francisco is 65 degrees Celsius.",
          },
        ],
      },
      statusCode: 200,
      model,
    });

    // Test request messages
    expect(result.schema.request.messages![0]).toEqual({
      content: "What's the weather like in San Francisco?",
      role: "user",
      _type: "message",
    });

    expect(result.schema.request.messages![1]).toEqual({
      content:
        '<thinking>I need to use get_weather, and the user wants SF, which is likely San Francisco, CA.</thinking> get_weather({"location":"San Francisco, CA","unit":"celsius"})',
      role: "assistant",
      _type: "message",
      tool_calls: [
        {
          id: "toolu_01A09q90qw90lq917835lq9",
          name: "get_weather",
          arguments: {
            location: "San Francisco, CA",
            unit: "celsius",
          },
        },
      ],
    });

    expect(result.schema.request.messages![2]).toEqual({
      content: "65 degrees",
      role: "user",
      _type: "message",
    });

    // Test response message
    expect(result.schema.response!.messages![0]).toEqual({
      id: expect.any(String),
      content:
        "The current temperature in San Francisco is 65 degrees Celsius.",
      role: "assistant",
      _type: "message",
    });

    // Test preview
    expect(result.preview.request).toContain(
      "What's the weather like in San Francisco?"
    );
    expect(result.preview.response).toBe(
      "The current temperature in San Francisco is 65 degrees Celsius."
    );
  });
});
