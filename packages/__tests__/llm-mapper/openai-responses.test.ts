import { Message } from "../../llm-mapper/types";
import {
  getRequestText,
  getResponseText,
  mapOpenAIResponse,
} from "../../llm-mapper/mappers/openai/responses";

describe("OpenAI Responses API Mapper", () => {
  describe("getRequestText", () => {
    it("should extract text from string input", () => {
      const request = {
        model: "gpt-4",
        input: "Tell me about quantum computing",
      };

      const result = getRequestText(request as any);
      expect(result).toBe("Tell me about quantum computing");
    });

    it("should handle array input with text content", () => {
      const request = {
        model: "gpt-4",
        input: [
          {
            role: "user" as const,
            content: [
              {
                type: "input_text" as const,
                text: "[REDACTED QUESTION]",
              },
            ],
          },
        ],
      };

      const result = getRequestText(request as any);
      expect(result).toBe("[REDACTED QUESTION]");
    });

    it("should handle array input with image content", () => {
      const request = {
        model: "gpt-4",
        input: [
          {
            role: "user" as const,
            content: [
              {
                type: "input_image" as const,
                image_url: "https://redacted.example.com/image.jpg",
                detail: "high" as const,
              },
            ],
          },
        ],
      };

      const result = getRequestText(request as any);
      expect(result).toBe("[Image]");
    });

    it("should handle array input with file content", () => {
      const request = {
        model: "gpt-4",
        input: [
          {
            role: "user" as const,
            content: [
              {
                type: "input_file" as const,
                filename: "[REDACTED_FILENAME].pdf",
                file_data: "[REDACTED_BASE64_DATA]",
              },
            ],
          },
        ],
      };

      const result = getRequestText(request as any);
      expect(result).toBe("[File]");
    });

    it("should prefer text content in mixed input", () => {
      const request = {
        model: "gpt-4",
        input: [
          {
            role: "user" as const,
            content: [
              {
                type: "input_image" as const,
                image_url: "https://redacted.example.com/image.jpg",
                detail: "high" as const,
              },
              {
                type: "input_text" as const,
                text: "[REDACTED ANALYSIS QUESTION]",
              },
            ],
          },
        ],
      };

      const result = getRequestText(request as any);
      expect(result).toBe("[REDACTED ANALYSIS QUESTION]");
    });

    it("should handle heliconeMessage fallback", () => {
      const request = {
        model: "gpt-4",
        input: [],
        heliconeMessage: "[REDACTED HELICONE MESSAGE]",
      };

      const result = getRequestText(request as any);
      expect(result).toBe("[REDACTED HELICONE MESSAGE]");
    });

    it("should return empty string for invalid input", () => {
      const request = {
        model: "gpt-4",
      };

      const result = getRequestText(request as any);
      expect(result).toBe("");
    });
  });

  describe("getResponseText", () => {
    it("should extract text from consolidated response item.content format", () => {
      const response = {
        item: {
          id: "resp-[REDACTED]",
          role: "assistant" as const,
          content: [
            {
              type: "output_text",
              text: "[REDACTED RESPONSE TEXT]",
            },
          ],
        },
      };

      const result = getResponseText(response);
      expect(result).toBe("[REDACTED RESPONSE TEXT]");
    });

    it("should extract text from standard output array format", () => {
      const response = {
        output: [
          {
            type: "message",
            id: "msg-[REDACTED]",
            role: "assistant" as const,
            content: [
              {
                type: "output_text",
                text: "[REDACTED ASSISTANT RESPONSE]",
              },
            ],
          },
        ],
      };

      const result = getResponseText(response);
      expect(result).toBe("[REDACTED ASSISTANT RESPONSE]");
    });

    it("should handle error responses", () => {
      const response = {
        error: {
          message: "[REDACTED ERROR MESSAGE]",
          type: "invalid_request_error",
        },
      };

      const result = getResponseText(response);
      expect(result).toBe("[REDACTED ERROR MESSAGE]");
    });

    it("should handle empty responses", () => {
      const response = {};

      const result = getResponseText(response);
      expect(result).toBe("");
    });

    it("should handle status code 0", () => {
      const response = {
        item: {
          content: [{ type: "output_text", text: "Should be ignored" }],
        },
      };

      const result = getResponseText(response, 0);
      expect(result).toBe("");
    });

    it("should handle non-text content types gracefully", () => {
      const response = {
        item: {
          content: [
            {
              type: "output_image",
              data: "[REDACTED_IMAGE_DATA]",
            },
          ],
        },
      };

      const result = getResponseText(response);
      expect(result).toBe("[output_image]");
    });
  });

  describe("Request Input Conversion", () => {
    it("should convert string input to message", () => {
      const request = {
        model: "gpt-4",
        input: "[REDACTED USER QUERY]",
      };

      const result = mapOpenAIResponse({
        request: request as any,
        response: {},
        model: "gpt-4",
      });

      expect(result.schema.request?.messages).toHaveLength(1);
      expect(result.schema.request?.messages?.[0]).toMatchObject({
        _type: "message",
        role: "user" as const,
        type: "input_text" as const,
        content: "[REDACTED USER QUERY]",
        id: "req-msg-0",
      });
    });

    it("should parse JSON string content in user messages", () => {
      const request = {
        model: "gpt-4",
        input: [
          {
            type: "message",
            role: "user" as const,
            content: "[{'type': 'text', 'text': '[REDACTED QUESTION]'}]",
          },
        ],
      };

      const result = mapOpenAIResponse({
        request: request as any,
        response: {},
        model: "gpt-4",
      });

      expect(result.schema.request?.messages).toHaveLength(1);
      expect(result.schema.request?.messages?.[0]).toMatchObject({
        _type: "message",
        role: "user" as const,
        type: "input_text" as const,
        content: "[REDACTED QUESTION]",
        id: "req-msg-0",
      });
    });

    it("should group function calls into tool_calls array", () => {
      const request = {
        model: "gpt-4",
        input: [
          {
            type: "message",
            role: "system" as const,
            content: "[REDACTED SYSTEM PROMPT]",
          },
          {
            type: "message",
            role: "user" as const,
            content: "[REDACTED USER QUESTION]",
          },
          {
            type: "function_call",
            id: "call_[REDACTED]",
            name: "[REDACTED_FUNCTION_NAME]",
            arguments: '{"query": "[REDACTED_QUERY]"}',
          },
        ],
      };

      const result = mapOpenAIResponse({
        request: request as any,
        response: {},
        model: "gpt-4",
      });

      expect(result.schema.request?.messages).toHaveLength(3);

      // Check system message
      expect(result.schema.request?.messages?.[0]).toMatchObject({
        _type: "message",
        role: "system" as const,
        content: "[REDACTED SYSTEM PROMPT]",
      });

      // Check user message
      expect(result.schema.request?.messages?.[1]).toMatchObject({
        _type: "message",
        role: "user" as const,
        content: "[REDACTED USER QUESTION]",
      });

      // Check assistant message with tool calls
      expect(result.schema.request?.messages?.[2]).toMatchObject({
        _type: "message",
        role: "assistant" as const,
        content: "",
        tool_calls: [
          {
            id: "call_[REDACTED]",
            name: "[REDACTED_FUNCTION_NAME]",
            arguments: { query: "[REDACTED_QUERY]" },
            type: "function",
          },
        ],
      });
    });

    it("should handle multiple function calls in sequence - each as separate message", () => {
      const request = {
        model: "gpt-4",
        input: [
          {
            type: "function_call",
            id: "call_[REDACTED_1]",
            name: "[REDACTED_FUNCTION_1]",
            arguments: '{"param1": "[REDACTED_VALUE_1]"}',
          },
          {
            type: "function_call",
            id: "call_[REDACTED_2]",
            name: "[REDACTED_FUNCTION_2]",
            arguments: '{"param2": "[REDACTED_VALUE_2]"}',
          },
        ],
      };

      const result = mapOpenAIResponse({
        request: request as any,
        response: {},
        model: "gpt-4",
      });

      // Each function_call should be a separate assistant message to preserve chronological order
      expect(result.schema.request?.messages).toHaveLength(2);
      expect(result.schema.request?.messages?.[0]).toMatchObject({
        _type: "message",
        role: "assistant" as const,
        content: "",
        tool_calls: [
          {
            id: "call_[REDACTED_1]",
            name: "[REDACTED_FUNCTION_1]",
            arguments: { param1: "[REDACTED_VALUE_1]" },
            type: "function",
          },
        ],
      });
      expect(result.schema.request?.messages?.[1]).toMatchObject({
        _type: "message",
        role: "assistant" as const,
        content: "",
        tool_calls: [
          {
            id: "call_[REDACTED_2]",
            name: "[REDACTED_FUNCTION_2]",
            arguments: { param2: "[REDACTED_VALUE_2]" },
            type: "function",
          },
        ],
      });
    });

    it("should handle function call outputs with proper tool_call_id linking", () => {
      const request = {
        model: "gpt-4",
        input: [
          {
            type: "function_call",
            id: "call_[REDACTED]",
            name: "[REDACTED_FUNCTION]",
            arguments: '{"query": "[REDACTED]"}',
          },
          {
            type: "function_call_output",
            call_id: "call_[REDACTED]",
            output: "[REDACTED FUNCTION RESULT]",
          },
        ],
      };

      const result = mapOpenAIResponse({
        request: request as any,
        response: {},
        model: "gpt-4",
      });

      expect(result.schema.request?.messages).toHaveLength(2);

      // Check assistant message with tool call
      expect(result.schema.request?.messages?.[0]).toMatchObject({
        _type: "message",
        role: "assistant" as const,
        content: "",
        tool_calls: [
          {
            id: "call_[REDACTED]",
            name: "[REDACTED_FUNCTION]",
            arguments: { query: "[REDACTED]" },
            type: "function",
          },
        ],
      });

      // Check tool result message with proper linking
      expect(result.schema.request?.messages?.[1]).toMatchObject({
        _type: "function",
        tool_call_id: "call_[REDACTED]",
        content: "[REDACTED FUNCTION RESULT]",
        role: "tool",
      });
    });

    it("should handle complex mixed content arrays", () => {
      const request = {
        model: "gpt-4",
        input: [
          {
            role: "user" as const,
            content: [
              {
                type: "input_text" as const,
                text: "[REDACTED TEXT]",
              },
              {
                type: "input_image" as const,
                image_url: "https://redacted.example.com/image.jpg",
                detail: "high" as const,
              },
              {
                type: "input_file" as const,
                filename: "[REDACTED].pdf",
                file_data: "[REDACTED_BASE64]",
              },
            ],
          },
        ],
      };

      const result = mapOpenAIResponse({
        request: request as any,
        response: {},
        model: "gpt-4",
      });

      expect(result.schema.request?.messages).toHaveLength(1);
      expect(result.schema.request?.messages?.[0]).toMatchObject({
        _type: "contentArray",
        role: "user" as const,
        contentArray: [
          {
            _type: "message",
            role: "user" as const,
            type: "input_text" as const,
            content: "[REDACTED TEXT]",
          },
          {
            _type: "image",
            role: "user" as const,
            type: "input_image",
            detail: "high",
            image_url: "https://redacted.example.com/image.jpg",
          },
          {
            _type: "file",
            role: "user" as const,
            type: "input_file" as const,
            file_data: "[REDACTED_BASE64]",
            filename: "[REDACTED].pdf",
          },
        ],
      });
    });
  });

  describe("Response Conversion", () => {
    it("should convert consolidated response with item.content structure", () => {
      const request = {
        model: "gpt-4",
        input: "[REDACTED QUERY]",
      };

      const response = {
        item: {
          id: "resp-[REDACTED]",
          role: "assistant" as const,
          content: [
            {
              type: "output_text",
              text: "[REDACTED DETAILED RESPONSE]",
            },
          ],
        },
      };

      const result = mapOpenAIResponse({
        request: request as any,
        response,
        model: "gpt-4",
      });

      expect(result.schema.response?.messages).toHaveLength(1);
      expect(result.schema.response?.messages?.[0]).toMatchObject({
        _type: "message",
        role: "assistant" as const,
        content: "[REDACTED DETAILED RESPONSE]",
        id: "resp-[REDACTED]",
      });
    });

    it("should convert standard output array response", () => {
      const request = {
        model: "gpt-4",
        input: "[REDACTED QUERY]",
      };

      const response = {
        output: [
          {
            type: "message",
            id: "msg-[REDACTED]",
            role: "assistant" as const,
            content: [
              {
                type: "output_text",
                text: "[REDACTED RESPONSE TEXT]",
              },
            ],
          },
        ],
      };

      const result = mapOpenAIResponse({
        request: request as any,
        response,
        model: "gpt-4",
      });

      expect(result.schema.response?.messages).toHaveLength(1);
      expect(result.schema.response?.messages?.[0]).toMatchObject({
        _type: "message",
        role: "assistant" as const,
        content: "[REDACTED RESPONSE TEXT]",
        id: "msg-[REDACTED]",
      });
    });

    it("should handle responses with no content gracefully", () => {
      const request = {
        model: "gpt-4",
        input: "[REDACTED QUERY]",
      };

      const response = {
        item: {
          id: "resp-[REDACTED]",
          role: "assistant" as const,
          content: [],
        },
      };

      const result = mapOpenAIResponse({
        request: request as any,
        response,
        model: "gpt-4",
      });

      expect(result.schema.response?.messages).toHaveLength(1);
      expect(result.schema.response?.messages?.[0]).toMatchObject({
        _type: "message",
        role: "assistant" as const,
        content: "",
        id: "resp-[REDACTED]",
      });
    });

    it("should handle empty response", () => {
      const request = {
        model: "gpt-4",
        input: "[REDACTED QUERY]",
      };

      const response = {};

      const result = mapOpenAIResponse({
        request: request as any,
        response,
        model: "gpt-4",
      });

      expect(result.schema.response?.messages).toEqual([]);
    });
  });

  describe("Full Request-Response Integration", () => {
    it("should handle complete function calling workflow", () => {
      const request = {
        model: "gpt-4",
        input: [
          {
            type: "message",
            role: "system" as const,
            content: "[REDACTED SYSTEM INSTRUCTIONS]",
          },
          {
            type: "message",
            role: "user" as const,
            content: "[REDACTED USER QUESTION]",
          },
          {
            type: "function_call",
            id: "call_[REDACTED]",
            name: "[REDACTED_SEARCH_FUNCTION]",
            arguments: '{"query": "[REDACTED_SEARCH_QUERY]"}',
          },
          {
            type: "function_call_output",
            call_id: "call_[REDACTED]",
            output: "[REDACTED SEARCH RESULTS]",
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "[REDACTED_SEARCH_FUNCTION]",
              description: "[REDACTED FUNCTION DESCRIPTION]",
              parameters: {
                type: "object",
                properties: {
                  query: { type: "string", description: "[REDACTED]" },
                },
                required: ["query"],
              },
            },
          },
        ],
      };

      const response = {
        item: {
          id: "resp-[REDACTED]",
          role: "assistant" as const,
          content: [
            {
              type: "output_text",
              text: "[REDACTED FINAL ANSWER BASED ON SEARCH]",
            },
          ],
        },
      };

      const result = mapOpenAIResponse({
        request: request as any,
        response,
        model: "gpt-4",
      });

      // Verify request mapping
      expect(result.schema.request?.messages).toHaveLength(4);
      
      // System message
      expect(result.schema.request?.messages?.[0]).toMatchObject({
        _type: "message",
        role: "system" as const,
        content: "[REDACTED SYSTEM INSTRUCTIONS]",
      });

      // User message
      expect(result.schema.request?.messages?.[1]).toMatchObject({
        _type: "message",
        role: "user" as const,
        content: "[REDACTED USER QUESTION]",
      });

      // Assistant message with tool call
      expect(result.schema.request?.messages?.[2]).toMatchObject({
        _type: "message",
        role: "assistant" as const,
        content: "",
        tool_calls: [
          {
            id: "call_[REDACTED]",
            name: "[REDACTED_SEARCH_FUNCTION]",
            arguments: { query: "[REDACTED_SEARCH_QUERY]" },
            type: "function",
          },
        ],
      });

      // Tool result message
      expect(result.schema.request?.messages?.[3]).toMatchObject({
        _type: "function",
        tool_call_id: "call_[REDACTED]",
        content: "[REDACTED SEARCH RESULTS]",
        role: "tool",
      });

      // Verify response mapping
      expect(result.schema.response?.messages).toHaveLength(1);
      expect(result.schema.response?.messages?.[0]).toMatchObject({
        _type: "message",
        role: "assistant" as const,
        content: "[REDACTED FINAL ANSWER BASED ON SEARCH]",
      });

      // Verify tools mapping
      expect(result.schema.request?.tools).toHaveLength(1);
      expect(result.schema.request?.tools?.[0]).toMatchObject({
        type: "function",
        name: "[REDACTED_SEARCH_FUNCTION]",
        description: "[REDACTED FUNCTION DESCRIPTION]",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "[REDACTED]" },
          },
          required: ["query"],
        },
      });

      // Verify preview - should extract content from the last message with actual content
      // which is the tool result "[REDACTED SEARCH RESULTS]"
      expect(result.preview.request).toBe("[REDACTED SEARCH RESULTS]");
      expect(result.preview.response).toBe("[REDACTED FINAL ANSWER BASED ON SEARCH]");
      expect(result.preview.concatenatedMessages).toHaveLength(5); // 4 request + 1 response
    });

    it("should handle malformed JSON content gracefully", () => {
      const request = {
        model: "gpt-4",
        input: [
          {
            type: "message",
            role: "user" as const,
            content: "[{'type': 'text' 'text': 'malformed json'}]", // Missing comma
          },
        ],
      };

      const result = mapOpenAIResponse({
        request: request as any,
        response: {},
        model: "gpt-4",
      });

      // Should keep original content when JSON parsing fails
      expect(result.schema.request?.messages?.[0]).toMatchObject({
        _type: "message",
        role: "user" as const,
        content: "[{'type': 'text' 'text': 'malformed json'}]",
      });
    });

    it("should preserve model information correctly", () => {
      const request = {
        model: "gpt-4-turbo",
        input: "[REDACTED QUERY]",
      };

      const response = {
        item: {
          content: [{ type: "output_text", text: "[REDACTED RESPONSE]" }],
        },
      };

      const result = mapOpenAIResponse({
        request: request as any,
        response,
        model: "gpt-4-turbo",
      });

      expect(result.schema.request?.model).toBe("gpt-4-turbo");
      expect(result.schema.response?.model).toBe("gpt-4-turbo");
    });
  });

  describe("Error Handling", () => {
    it("should handle parsing errors gracefully", () => {
      // Test with circular reference that would cause JSON.stringify to fail
      const circularObj: any = { prop: "value" };
      circularObj.self = circularObj;

      expect(() => {
        getRequestText(circularObj);
      }).not.toThrow();

      expect(() => {
        getResponseText(circularObj);
      }).not.toThrow();
    });

    it("should handle null and undefined inputs", () => {
      expect(getRequestText(null as any)).toBe("");
      expect(getRequestText(undefined as any)).toBe("");
      expect(getResponseText(null as any)).toBe("");
      expect(getResponseText(undefined as any)).toBe("");
    });
  });
});