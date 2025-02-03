import { Message } from "@/llm-mapper/types";
import {
  getResponseText,
  mapOpenAIRequest,
} from "../../llm-mapper/mappers/openai/chat";

describe("OpenAI Chat Mapper", () => {
  describe("getRequestText", () => {
    it("should handle image content in messages", () => {
      const request = {
        messages: [
          {
            content: [
              {
                type: "text",
                text: "[REDACTED TEXT]",
              },
              {
                type: "image_url",
                image_url: {
                  url: "https://redacted.amazonaws.com/example-image.jpg",
                },
              },
            ],
          },
        ],
      };

      const result = mapOpenAIRequest({
        request,
        response: {},
        statusCode: 200,
        model: "gpt-4",
      });

      expect(result.preview.request).toBe("[REDACTED TEXT]");
    });

    it("should handle single image message", () => {
      const request = {
        messages: [
          {
            content: {
              type: "image_url",
              image_url: {
                url: "https://redacted.amazonaws.com/example-image.jpg",
              },
            },
          },
        ],
      };

      const result = mapOpenAIRequest({
        request,
        response: {},
        statusCode: 200,
        model: "gpt-4",
      });

      expect(result.preview.request).toBe("[Image]");
    });

    it("should handle mixed content with images", () => {
      const request = {
        messages: [
          {
            content: [
              {
                type: "image_url",
                image_url: {
                  url: "https://redacted.amazonaws.com/example-image.jpg",
                },
              },
              {
                type: "text",
                text: "[REDACTED TEXT]",
              },
            ],
          },
        ],
      };

      const result = mapOpenAIRequest({
        request,
        response: {},
        statusCode: 200,
        model: "gpt-4",
      });

      expect(result.preview.request).toBe("[REDACTED TEXT]");
    });

    it("should handle complex nutritional analysis request", () => {
      const request = {
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "[REDACTED TEXT]",
              },
              {
                type: "image_url",
                image_url: {
                  url: "https://redacted.amazonaws.com/example-image.jpg",
                },
              },
            ],
          },
        ],
      };

      const response = {
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                name: "[REDACTED]",
              }),
            },
            finish_reason: "stop",
          },
        ],
      };

      const result = mapOpenAIRequest({
        request,
        response,
        statusCode: 200,
        model: "gpt-4",
      });

      // Verify request text extraction
      expect(result.preview.request).toBe("[REDACTED TEXT]");

      // Verify image is included in schema
      expect(result.schema.request?.messages).toBeDefined();
      expect(result.schema.request?.messages).toHaveLength(1);
      expect(result.schema.request?.messages?.[0]).toEqual({
        role: "user",
        _type: "image",
        image_url: "https://redacted.amazonaws.com/example-image.jpg",
        content: "[REDACTED TEXT]",
      } as Message);

      // Verify schema structure
      expect(result.schema).toMatchObject({
        request: {
          model: "gpt-4",
          messages: expect.any(Array),
        },
        response: {
          messages: expect.any(Array),
        },
      });
    });

    it("should handle tool calls in streaming response", () => {
      const request = {
        messages: [
          {
            role: "user",
            content: "[REDACTED TEXT]",
          },
        ],
      };

      const response = {
        choices: [
          {
            delta: {
              refusal: null,
              role: "assistant",
              tool_calls: [
                {
                  function: {
                    arguments: '{"param":"[REDACTED]"}',
                    name: "[REDACTED_FUNCTION_NAME]",
                  },
                  id: "call_123",
                  index: 0,
                  type: "function",
                },
              ],
            },
            message: {
              refusal: null,
              role: "assistant",
              tool_calls: [
                {
                  function: {
                    arguments: '{"param":"[REDACTED]"}',
                    name: "[REDACTED_FUNCTION_NAME]",
                  },
                  id: "call_123",
                  index: 0,
                  type: "function",
                },
              ],
            },
          },
        ],
        object: "chat.completion.chunk",
      };

      const result = mapOpenAIRequest({
        request,
        response,
        statusCode: 200,
        model: "gpt-4",
      });

      // Verify tool calls are properly formatted in preview
      expect(result.preview.response).toBe(
        '[REDACTED_FUNCTION_NAME]({"param":"[REDACTED]"})'
      );

      // Verify schema structure
      expect(result.schema).toMatchObject({
        request: {
          model: "gpt-4",
          messages: expect.any(Array),
        },
        response: {
          messages: expect.any(Array),
        },
      });
    });

    it("should handle streaming response with complex tool calls", () => {
      const request = {
        messages: [
          {
            role: "user",
            content: "[REDACTED TEXT]",
          },
        ],
      };

      const response = {
        choices: [
          {
            delta: {
              refusal: null,
              role: "assistant",
              tool_calls: [
                {
                  function: {
                    arguments: JSON.stringify({
                      cards: [
                        {
                          question: "[REDACTED QUESTION]",
                          answer: "[REDACTED ANSWER]",
                          pageNumber: 3,
                        },
                      ],
                      deckId: "[REDACTED UUID]",
                      userId: "[REDACTED UUID]",
                    }),
                    name: "[REDACTED_FUNCTION_NAME]",
                  },
                  id: "call_123",
                  index: 0,
                  type: "function",
                },
              ],
            },
            message: {
              refusal: null,
              role: "assistant",
              tool_calls: [
                {
                  function: {
                    arguments: JSON.stringify({
                      cards: [
                        {
                          question: "[REDACTED QUESTION]",
                          answer: "[REDACTED ANSWER]",
                          pageNumber: 3,
                        },
                      ],
                      deckId: "[REDACTED UUID]",
                      userId: "[REDACTED UUID]",
                    }),
                    name: "[REDACTED_FUNCTION_NAME]",
                  },
                  id: "call_123",
                  index: 0,
                  type: "function",
                },
              ],
            },
          },
        ],
        created: 0,
        id: "[REDACTED]",
        model: "gpt-4",
        object: "chat.completion.chunk",
        prompt_filter_results: [
          {
            prompt_index: 0,
            content_filter_results: {
              hate: { filtered: false, severity: "safe" },
              self_harm: { filtered: false, severity: "safe" },
              sexual: { filtered: false, severity: "safe" },
              violence: { filtered: false, severity: "safe" },
            },
          },
        ],
        streamed_data: [],
      };

      const result = mapOpenAIRequest({
        request,
        response,
        statusCode: 200,
        model: "gpt-4",
      });

      // Verify tool calls are properly formatted in preview
      expect(result.preview.response).toBe(
        '[REDACTED_FUNCTION_NAME]({"cards":[{"question":"[REDACTED QUESTION]","answer":"[REDACTED ANSWER]","pageNumber":3}],"deckId":"[REDACTED UUID]","userId":"[REDACTED UUID]"})'
      );

      // Verify schema structure
      expect(result.schema).toMatchObject({
        request: {
          model: "gpt-4",
          messages: expect.any(Array),
        },
        response: {
          messages: expect.any(Array),
        },
      });
    });

    it("should handle tool calls and tool responses correctly", () => {
      const request = {
        messages: [
          {
            role: "system",
            content: "Test system message",
          },
        ],
      };

      const response = {
        choices: [
          {
            message: {
              role: "assistant",
              content: "",
              tool_calls: [
                {
                  function: {
                    name: "create_reminder_tool",
                    arguments:
                      '{"reminder_time":"2024-08-20 21:30:00","reminder_message":"Reminder watch"}',
                  },
                  type: "function",
                  id: "call_123",
                },
              ],
            },
          },
        ],
      };

      const result = mapOpenAIRequest({
        request,
        response,
        statusCode: 200,
        model: "gpt-4",
      });

      // Verify schema structure
      expect(result.schema.response?.messages).toHaveLength(1);
      expect(result.schema.response?.messages?.[0]).toMatchObject({
        content: "",
        role: "assistant",
        _type: "functionCall",
        tool_calls: [
          {
            name: "create_reminder_tool",
            arguments: {
              reminder_time: "2024-08-20 21:30:00",
              reminder_message: "Reminder watch",
            },
          },
        ],
      });

      // Verify concatenated messages
      expect(result.preview.concatenatedMessages).toHaveLength(2);
      expect(result.preview.concatenatedMessages[0]).toMatchObject({
        content: "Test system message",
        role: "system",
        _type: "message",
      });
      expect(result.preview.concatenatedMessages[1]).toMatchObject({
        content: "",
        role: "assistant",
        _type: "functionCall",
        tool_calls: [
          {
            name: "create_reminder_tool",
            arguments: {
              reminder_time: "2024-08-20 21:30:00",
              reminder_message: "Reminder watch",
            },
          },
        ],
      });
    });

    it("should handle tool calls in request messages", () => {
      const request = {
        messages: [
          {
            role: "system",
            content: "Test system message",
          },
          {
            role: "assistant",
            content: "",
            tool_calls: [
              {
                function: {
                  name: "create_reminder_tool",
                  arguments:
                    '{"reminder_time":"2024-08-20 21:30:00","reminder_message":"Reminder watch"}',
                },
                type: "function",
                id: "call_123",
              },
            ],
          },
          {
            role: "tool",
            content: "Reminder has been set!",
            tool_call_id: "call_123",
          },
        ],
      };

      const result = mapOpenAIRequest({
        request,
        response: {},
        statusCode: 200,
        model: "gpt-4",
      });

      // Verify request messages are mapped correctly
      expect(result.schema.request?.messages).toHaveLength(3);

      // Check system message
      expect(result.schema.request?.messages?.[0]).toMatchObject({
        content: "Test system message",
        role: "system",
        _type: "message",
      });

      // Check assistant message with tool call
      expect(result.schema.request?.messages?.[1]).toMatchObject({
        content: "",
        role: "assistant",
        _type: "functionCall",
        tool_calls: [
          {
            name: "create_reminder_tool",
            arguments: {
              reminder_time: "2024-08-20 21:30:00",
              reminder_message: "Reminder watch",
            },
          },
        ],
      });

      // Check tool response message
      expect(result.schema.request?.messages?.[2]).toMatchObject({
        content: "Reminder has been set!",
        role: "tool",
        _type: "message",
      });

      // Verify concatenated messages
      expect(result.preview.concatenatedMessages).toHaveLength(3);
      expect(result.preview.concatenatedMessages).toEqual(
        result.schema.request?.messages
      );
    });
  });
});

describe("Response Preview", () => {
  it("should handle tool calls in streaming response", () => {
    const result = getResponseText(
      {
        choices: [
          {
            delta: {
              refusal: null,
              role: "assistant",
              tool_calls: [
                {
                  function: {
                    arguments: '{"deckId":"[REDACTED]","pageNumber":7}',
                    name: "[REDACTED_FUNCTION_NAME]",
                  },
                  id: "call_123",
                  index: 0,
                  type: "function",
                },
              ],
            },
            message: {
              refusal: null,
              role: "assistant",
              tool_calls: [
                {
                  function: {
                    arguments: '{"deckId":"[REDACTED]","pageNumber":7}',
                    name: "[REDACTED_FUNCTION_NAME]",
                  },
                  id: "call_123",
                  index: 0,
                  type: "function",
                },
              ],
            },
          },
        ],
      },
      200,
      "gpt-4"
    );

    expect(result).toBe(
      '[REDACTED_FUNCTION_NAME]({"deckId":"[REDACTED]","pageNumber":7})'
    );
  });
});
