import { describe, expect, it } from "@jest/globals";
import { mapGeminiPro } from "../../llm-mapper/mappers/gemini/chat";
import { mapAnthropicRequest } from "../../llm-mapper/mappers/anthropic/chat";
import { Message } from "@/llm-mapper/types";
import { getRequestMessages } from "@/llm-mapper/mappers/anthropic/requestParser";

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
});

describe("mapAnthropicRequest", () => {
  it("should handle system messages", () => {
    const result = mapAnthropicRequest({
      request: {
        system: "You are a helpful assistant",
        messages: [
          {
            role: "user",
            content: "Hello",
          },
        ],
      },
      response: {
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "Hi there!",
          },
        ],
      },
      statusCode: 200,
      model: "claude-3-sonnet",
    });

    // Check system message is first in request messages
    expect(result.schema.request.messages![0]).toEqual({
      role: "system",
      content: "You are a helpful assistant",
      _type: "message",
      id: expect.any(String),
    });

    // Check user message follows
    expect(result.schema.request.messages![1]).toEqual({
      role: "user",
      content: "Hello",
      _type: "message",
      id: expect.any(String),
    });

    // Check response message
    expect(result.schema.response!.messages![0]).toEqual({
      role: "assistant",
      content: "Hi there!",
      _type: "message",
      id: expect.any(String),
    });
  });

  it("should handle content arrays with mixed text and images", () => {
    const result = mapAnthropicRequest({
      request: {
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Page 1",
              },
              {
                type: "image_url",
                image_url: {
                  url: "data:image/1",
                },
              },
              {
                type: "text",
                text: "Page 2",
              },
              {
                type: "image_url",
                image_url: {
                  url: "data:image/2",
                },
              },
            ],
          },
        ],
      },
      response: {
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "I see two pages",
          },
        ],
      },
      statusCode: 200,
      model: "claude-3-sonnet",
    });

    // Check request message structure
    const requestMessage = result.schema.request.messages![0];

    expect(requestMessage._type).toBe("contentArray");
    expect(requestMessage.image_url).toBeUndefined();

    expect(requestMessage.contentArray).toHaveLength(4);

    // Verify content array items
    const contentArray = requestMessage.contentArray!;
    expect(contentArray[0]).toEqual({
      content: "Page 1",
      role: "user",
      _type: "message",
      id: expect.any(String),
    });
    expect(contentArray[1]).toEqual({
      content: "",
      role: "user",
      _type: "image",
      image_url: "data:image/1",
      id: expect.any(String),
    });
    expect(contentArray[2]).toEqual({
      content: "Page 2",
      role: "user",
      _type: "message",
      id: expect.any(String),
    });
    expect(contentArray[3]).toEqual({
      content: "",
      role: "user",
      _type: "image",
      image_url: "data:image/2",
      id: expect.any(String),
    });

    // Check response message
    expect(result.schema.response!.messages![0]).toEqual({
      role: "assistant",
      content: "I see two pages",
      _type: "message",
      id: expect.any(String),
    });
  });

  it("should handle streamed responses with undefined values", () => {
    const result = mapAnthropicRequest({
      request: {
        model: "claude-3-5-sonnet-latest",
        max_tokens: 4096,
        temperature: 0,
        system: "[REDACTED SYSTEM PROMPT]",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "[REDACTED USER MESSAGE]",
              },
            ],
          },
        ],
        tools: [
          {
            name: "[REDACTED TOOL NAME]",
            description: "[REDACTED TOOL DESCRIPTION]",
            input_schema: {
              type: "object",
              properties: {
                topic: {
                  type: "string",
                  description: "[REDACTED PROPERTY DESCRIPTION]",
                },
              },
              required: ["topic"],
              additionalProperties: false,
              $schema: "http://json-schema.org/draft-07/schema#",
            },
          },
        ],
        tool_choice: {
          type: "auto",
        },
        stream: true,
      },
      response: {
        id: "[REDACTED ID]",
        type: "message_stop",
        role: "assistant",
        model: "claude-3-5-sonnet-20241022",
        content: [
          {
            type: "text",
            text: "[REDACTED RESPONSE]undefinedundefinedundefinedundefined",
          },
        ],
        stop_reason: "tool_use",
        stop_sequence: null,
        usage: {
          input_tokens: 100,
          output_tokens: 20,
        },
      },
      model: "claude-3-5-sonnet-20241022",
      statusCode: 200,
    });

    // Check response message
    const response = result.schema.response;
    expect(response?.messages![0]?.content).toBe("[REDACTED RESPONSE]");

    // Check preview
    expect(result.preview.request).toBe("[REDACTED USER MESSAGE]");
    expect(result.preview.response).toBe("[REDACTED RESPONSE]");
  });

  it("Anthropic Response with Streamed Data", () => {
    const result = mapAnthropicRequest({
      request: {
        model: "claude-3-5-sonnet-latest",
        max_tokens: 4096,
        temperature: 0,
        system: [
          {
            type: "text",
            text: "[REDACTED SYSTEM PROMPT]",
          },
        ],
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "[REDACTED USER MESSAGE 1]",
              },
            ],
          },
          {
            role: "assistant",
            content: [
              {
                type: "text",
                text: "[REDACTED ASSISTANT MESSAGE]",
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "[REDACTED USER MESSAGE 2]",
              },
            ],
          },
        ],
        tools: [
          {
            name: "[REDACTED TOOL NAME]",
            description: "[REDACTED TOOL DESCRIPTION]",
            input_schema: {
              type: "object",
              properties: {
                topic: {
                  type: "string",
                  description: "[REDACTED PROPERTY DESCRIPTION]",
                },
              },
              required: ["topic"],
              additionalProperties: false,
              $schema: "http://json-schema.org/draft-07/schema#",
            },
          },
        ],
        tool_choice: {
          type: "auto",
        },
        stream: true,
      },
      response: {
        id: "[REDACTED ID]",
        type: "message_stop",
        role: "assistant",
        model: "claude-3-5-sonnet-20241022",
        content: [
          {
            type: "text",
            text: "[REDACTED RESPONSE]undefinedundefinedundefinedundefinedundefinedundefinedundefined",
          },
        ],
        stop_reason: "tool_use",
        stop_sequence: null,
        usage: {
          input_tokens: 2664,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          output_tokens: 86,
        },
      },
      model: "claude-3-5-sonnet-20241022",
      statusCode: 200,
    });

    // Check response message
    const response = result.schema.response;
    expect(response?.messages![0]?.content).toEqual("[REDACTED RESPONSE]");

    // Check preview
    expect(result.preview.request).toBe("[REDACTED USER MESSAGE 2]");
    expect(result.preview.response).toBe("[REDACTED RESPONSE]");
  });

  it("should handle stringified JSON content in message", () => {
    const result = mapAnthropicRequest({
      request: {
        messages: [
          {
            role: "user",
            content: "hello",
          },
        ],
        max_tokens: 50,
        model: "claude-3-5-sonnet-20241022",
      },
      response: {
        id: "[REDACTED ID]",
        object: "chat",
        created: "[REDACTED TIMESTAMP]",
        model: "claude-3-5-sonnet-20241022",
        choices: [
          {
            index: 0,
            logprobs: null,
            finish_reason: "end_turn",
            message: {
              role: "assistant",
              content:
                '[{"type":"text","text":"Hi! How can I help you today?"}]',
            },
          },
        ],
        usage: {
          prompt_tokens: 8,
          completion_tokens: 12,
          total_tokens: 20,
        },
        system_fingerprint: null,
      },
      statusCode: 200,
      model: "claude-3-5-sonnet-20241022",
    });

    // Check request message
    expect(result.schema.request.messages![0]).toEqual({
      role: "user",
      content: "hello",
      _type: "message",
      id: expect.any(String),
    });

    // Check response message
    expect(result.schema.response!.messages![0]).toEqual({
      role: "assistant",
      content: "Hi! How can I help you today?",
      _type: "message",
      id: expect.any(String),
    });

    // Check preview
    expect(result.preview.request).toBe("hello");
    expect(result.preview.response).toBe("Hi! How can I help you today?");
  });
});

describe("getRequestMessages", () => {
  it("should handle tool use and tool results in messages", () => {
    const request = {
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: "Hello",
        },
        {
          role: "assistant",
          content: [
            {
              text: "Hi there",
              type: "text",
            },
            {
              id: "tool_123",
              input: { param: "value" },
              name: "test_tool",
              type: "tool_use",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "tool_123",
              content: "Tool result data",
            },
          ],
        },
      ],
      model: "claude-3-test",
      system: "Test system message",
      temperature: 0,
    };

    const messages = getRequestMessages(request);

    // Check system message
    expect(messages[0]).toEqual({
      role: "system",
      content: "Test system message",
      _type: "message",
      id: expect.any(String),
    });

    // Check first user message
    expect(messages[1]).toEqual({
      role: "user",
      content: "Hello",
      _type: "message",
      id: expect.any(String),
    });

    // Check assistant message with tool use
    expect(messages[2]).toEqual({
      role: "assistant",
      _type: "contentArray",
      id: expect.any(String),
      contentArray: [
        {
          content: "Hi there",
          role: "assistant",
          _type: "message",
          id: expect.any(String),
        },
        {
          content: 'test_tool({"param":"value"})',
          role: "assistant",
          _type: "function",
          id: expect.any(String),
          tool_calls: [
            {
              arguments: {
                param: "value",
              },
              name: "test_tool",
            },
          ],
        },
      ],
    });

    // Check tool result message
    expect(messages[3]).toMatchObject({
      role: "user",
      _type: "contentArray",
      contentArray: [
        {
          content: "Tool result data",
          role: "user",
          _type: "functionCall",
          tool_call_id: "tool_123",
        },
      ],
    } as Message);
  });
});
