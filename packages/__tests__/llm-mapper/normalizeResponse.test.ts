import { normalizeAIGatewayResponse } from "../../llm-mapper/transform/providers/normalizeResponse";

describe("normalizeAIGatewayResponse", () => {
  describe("Non-streaming responses with RESPONSES body mapping", () => {
    /**
     * REGRESSION TEST for double-normalization bug
     *
     * Bug: When bodyMapping === "RESPONSES" and provider === "openai", the response
     * was being converted to Responses API format. This caused issues because:
     * 1. OpenAI can already return responses in Responses API format when requested
     * 2. Converting again would overwrite the output field, making it empty or incorrect
     *
     * Fix: Added "&& provider !== 'openai'" to prevent conversion for OpenAI responses
     *
     * This test simulates OpenAI returning a response ALREADY in Responses API format,
     * and verifies the output field remains intact (not overwritten by double-conversion).
     */
    it("should not double-normalize OpenAI responses with RESPONSES body mapping", async () => {
      // Simulate OpenAI returning a response ALREADY in Responses API format
      const openAIResponseInResponsesFormat = {
        id: "resp-123",
        object: "response",
        created: 1677652288,
        model: "gpt-4",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "Hello! How can I help you today?",
              },
            ],
          },
        ],
        usage: {
          input_tokens: 10,
          output_tokens: 20,
          total_tokens: 30,
        },
      };

      const result = await normalizeAIGatewayResponse({
        responseText: JSON.stringify(openAIResponseInResponsesFormat),
        isStream: false,
        provider: "openai",
        providerModelId: "gpt-4",
        responseFormat: "OPENAI",
        bodyMapping: "RESPONSES",
      });

      const parsed = JSON.parse(result);

      // CRITICAL: Should preserve the 'output' field and its content
      // This was the bug - double conversion would overwrite/empty this field
      expect(parsed.output).toBeDefined();
      expect(parsed.output).not.toBeNull();
      expect(parsed.output.length).toBeGreaterThan(0);
      expect(parsed.output[0].type).toBe("message");
      expect(parsed.output[0].content).toBeDefined();
      expect(parsed.output[0].content[0].type).toBe("output_text");
      expect(parsed.output[0].content[0].text).toBe("Hello! How can I help you today?");

      // Should remain in Responses API format
      expect(parsed.object).toBe("response");

      // Usage should still be normalized to OpenAI format (even if input was in Responses format)
      expect(parsed.usage).toBeDefined();
      expect(parsed.usage.prompt_tokens).toBe(10);
      expect(parsed.usage.completion_tokens).toBe(20);
      expect(parsed.usage.total_tokens).toBe(30);
    });

    it("should normalize Anthropic responses with RESPONSES body mapping", async () => {
      const anthropicResponse = {
        id: "msg_123",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "Hello from Anthropic!",
          },
        ],
        model: "claude-3-opus-20240229",
        stop_reason: "end_turn",
        usage: {
          input_tokens: 10,
          output_tokens: 15,
        },
      };

      const result = await normalizeAIGatewayResponse({
        responseText: JSON.stringify(anthropicResponse),
        isStream: false,
        provider: "anthropic",
        providerModelId: "claude-3-opus-20240229",
        responseFormat: "ANTHROPIC",
        bodyMapping: "RESPONSES",
      });

      const parsed = JSON.parse(result);

      // Should be in Responses API format
      expect(parsed.object).toBe("response");
      expect(parsed.output).toBeDefined();
      expect(parsed.output).toBeInstanceOf(Array);
      expect(parsed.output.length).toBeGreaterThan(0);

      // Should have content in the output
      expect(parsed.output[0].content).toBeDefined();
      expect(parsed.output[0].content[0].text).toBe("Hello from Anthropic!");
    });

    it("should keep OpenAI format when bodyMapping is not RESPONSES", async () => {
      const openAIResponse = {
        id: "chatcmpl-123",
        object: "chat.completion",
        created: 1677652288,
        model: "gpt-4",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Hello! This stays in OpenAI format.",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      const result = await normalizeAIGatewayResponse({
        responseText: JSON.stringify(openAIResponse),
        isStream: false,
        provider: "openai",
        providerModelId: "gpt-4",
        responseFormat: "OPENAI",
      });

      const parsed = JSON.parse(result);

      // Should remain in OpenAI format
      expect(parsed.object).toBe("chat.completion");
      expect(parsed.choices).toBeDefined();
      expect(parsed.choices[0].message.content).toBe("Hello! This stays in OpenAI format.");
    });

    it("should handle OpenAI responses with tool calls and RESPONSES body mapping", async () => {
      // Simulate OpenAI returning a response with tool calls ALREADY in Responses API format
      const openAIResponseWithToolsInResponsesFormat = {
        id: "resp-456",
        object: "response",
        created: 1677652288,
        model: "gpt-4",
        output: [
          {
            id: "call_abc123",
            type: "function_call",
            status: "completed",
            name: "get_weather",
            call_id: "call_abc123",
            arguments: '{"location":"San Francisco"}',
            parsed_arguments: null,
          },
        ],
        usage: {
          input_tokens: 50,
          output_tokens: 25,
          total_tokens: 75,
        },
      };

      const result = await normalizeAIGatewayResponse({
        responseText: JSON.stringify(openAIResponseWithToolsInResponsesFormat),
        isStream: false,
        provider: "openai",
        providerModelId: "gpt-4",
        responseFormat: "OPENAI",
        bodyMapping: "RESPONSES",
      });

      const parsed = JSON.parse(result);

      // Should remain in Responses API format
      expect(parsed.object).toBe("response");

      // CRITICAL: Should preserve the 'output' field with function calls
      expect(parsed.output).toBeDefined();
      expect(parsed.output).not.toBeNull();
      expect(parsed.output.length).toBeGreaterThan(0);

      // Should have function_call in output
      const functionCall = parsed.output.find((item: any) => item.type === "function_call");
      expect(functionCall).toBeDefined();
      expect(functionCall.name).toBe("get_weather");
      expect(functionCall.call_id).toBe("call_abc123");
      expect(functionCall.arguments).toBe('{"location":"San Francisco"}');
    });
  });

  describe("Streaming responses with RESPONSES body mapping", () => {
    /**
     * REGRESSION TEST for streaming double-normalization bug
     *
     * Bug: When bodyMapping === "RESPONSES" and provider === "openai", streaming responses
     * were being converted from Responses API SSE format to another format.
     * This caused the same issue as non-streaming: data loss from double-conversion.
     *
     * Fix: Added "&& provider !== 'openai'" to prevent conversion for OpenAI streaming responses
     *
     * This test simulates OpenAI returning a streaming response ALREADY in Responses API SSE format,
     * and verifies the output items remain intact (not overwritten by double-conversion).
     */
    it("should not double-normalize OpenAI streaming responses with RESPONSES body mapping", async () => {
      // Simulate OpenAI returning a streaming response ALREADY in Responses API SSE format
      const openAIStreamResponseInResponsesFormat = `event: response.created
data: {"type":"response.created","response":{"id":"resp-123","object":"response"}}

event: response.output_item.added
data: {"type":"response.output_item.added","item":{"type":"message","role":"assistant","content":[]}}

event: response.output_item.delta
data: {"type":"response.output_item.delta","delta":{"type":"content_part","content_part":{"type":"output_text","text":"Hello"}}}

event: response.output_item.delta
data: {"type":"response.output_item.delta","delta":{"type":"content_part","content_part":{"type":"output_text","text":"!"}}}

event: response.output_item.done
data: {"type":"response.output_item.done","item":{"type":"message","role":"assistant","content":[{"type":"output_text","text":"Hello!"}]}}

event: response.done
data: {"type":"response.done","response":{"id":"resp-123","object":"response","usage":{"input_tokens":10,"output_tokens":5,"total_tokens":15}}}

`;

      const result = await normalizeAIGatewayResponse({
        responseText: openAIStreamResponseInResponsesFormat,
        isStream: true,
        provider: "openai",
        providerModelId: "gpt-4",
        responseFormat: "OPENAI",
        bodyMapping: "RESPONSES",
      });

      // CRITICAL: Should preserve Responses API events in the data (not convert to OpenAI format)
      // Note: event: lines are normalized but the data content should remain
      expect(result).toContain("response.output_item.added");
      expect(result).toContain("response.output_item.delta");
      expect(result).toContain("response.output_item.done");
      expect(result).toContain("data: [DONE]");

      // Parse the events to verify they contain content
      const lines = result.split("\n\n").filter((l) => l.trim());
      const events = lines
        .map((line) => {
          const match = line.match(/data: ({.*})/);
          if (match) {
            try {
              return JSON.parse(match[1]);
            } catch (e) {
              return null;
            }
          }
          return null;
        })
        .filter(Boolean);

      // Should have events with output content
      expect(events.length).toBeGreaterThan(0);

      // Verify the output_item.done event has content preserved
      const doneEvent = events.find((e: any) => e?.type === "response.output_item.done");
      expect(doneEvent).toBeDefined();
      expect(doneEvent.item).toBeDefined();
      expect(doneEvent.item.content).toBeDefined();
      expect(doneEvent.item.content.length).toBeGreaterThan(0);
      expect(doneEvent.item.content[0].type).toBe("output_text");
      expect(doneEvent.item.content[0].text).toBe("Hello!");
    });

    it("should normalize Anthropic streaming responses with RESPONSES body mapping", async () => {
      const anthropicStreamResponse = `event: message_start
data: {"type":"message_start","message":{"id":"msg_123","type":"message","role":"assistant","content":[],"model":"claude-3-opus-20240229","usage":{"input_tokens":10,"output_tokens":0}}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"!"}}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":5}}

`;

      const result = await normalizeAIGatewayResponse({
        responseText: anthropicStreamResponse,
        isStream: true,
        provider: "anthropic",
        providerModelId: "claude-3-opus-20240229",
        responseFormat: "ANTHROPIC",
        bodyMapping: "RESPONSES",
      });

      // Should be in Responses API SSE format
      expect(result).toContain("event:");
      expect(result).toContain("data:");

      // Should have response events
      expect(result).toContain("response");

      // Parse the events to verify structure
      const lines = result.split("\n\n").filter((l) => l.trim());
      const events = lines
        .map((line) => {
          const match = line.match(/data: ({.*})/);
          if (match) {
            try {
              return JSON.parse(match[1]);
            } catch (e) {
              return null;
            }
          }
          return null;
        })
        .filter(Boolean);

      // Should have some events
      expect(events.length).toBeGreaterThan(0);
    });

    it("should keep OpenAI SSE format when bodyMapping is not RESPONSES", async () => {
      const openAIStreamResponse = `data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: [DONE]

`;

      const result = await normalizeAIGatewayResponse({
        responseText: openAIStreamResponse,
        isStream: true,
        provider: "openai",
        providerModelId: "gpt-4",
        responseFormat: "OPENAI",
      });

      // Should remain in OpenAI SSE format
      expect(result).toContain("data: {");
      expect(result).toContain('"object":"chat.completion.chunk"');
      expect(result).toContain("data: [DONE]");

      // Should NOT contain Responses API events
      expect(result).not.toContain("event: response");
    });
  });

  describe("Error handling", () => {
    it("should handle malformed JSON gracefully", async () => {
      const malformedResponse = "{invalid json}";

      await expect(
        normalizeAIGatewayResponse({
          responseText: malformedResponse,
          isStream: false,
          provider: "openai",
          providerModelId: "gpt-4",
          responseFormat: "OPENAI",
        })
      ).rejects.toThrow();
    });

    it("should handle empty responses", async () => {
      const emptyResponse = "{}";

      const result = await normalizeAIGatewayResponse({
        responseText: emptyResponse,
        isStream: false,
        provider: "openai",
        providerModelId: "gpt-4",
        responseFormat: "OPENAI",
      });

      const parsed = JSON.parse(result);

      // Usage processor adds default usage even for empty responses
      expect(parsed.usage).toBeDefined();
      expect(parsed.usage.prompt_tokens).toBe(0);
      expect(parsed.usage.completion_tokens).toBe(0);
      expect(parsed.usage.total_tokens).toBe(0);
    });

    it("should handle empty streaming responses", async () => {
      const emptyStreamResponse = "";

      const result = await normalizeAIGatewayResponse({
        responseText: emptyStreamResponse,
        isStream: true,
        provider: "openai",
        providerModelId: "gpt-4",
        responseFormat: "OPENAI",
      });

      expect(result).toBeDefined();
    });
  });

  describe("Usage normalization", () => {
    it("should normalize usage fields for OpenAI responses", async () => {
      const openAIResponse = {
        id: "chatcmpl-123",
        object: "chat.completion",
        created: 1677652288,
        model: "gpt-4",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Test response",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      };

      const result = await normalizeAIGatewayResponse({
        responseText: JSON.stringify(openAIResponse),
        isStream: false,
        provider: "openai",
        providerModelId: "gpt-4",
        responseFormat: "OPENAI",
      });

      const parsed = JSON.parse(result);

      // Usage should be normalized and present
      expect(parsed.usage).toBeDefined();
      expect(parsed.usage.prompt_tokens).toBe(100);
      expect(parsed.usage.completion_tokens).toBe(50);
      expect(parsed.usage.total_tokens).toBe(150);
    });

    it("should normalize usage fields for Anthropic responses", async () => {
      const anthropicResponse = {
        id: "msg_123",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "Test response from Claude",
          },
        ],
        model: "claude-3-opus-20240229",
        stop_reason: "end_turn",
        usage: {
          input_tokens: 75,
          output_tokens: 25,
        },
      };

      const result = await normalizeAIGatewayResponse({
        responseText: JSON.stringify(anthropicResponse),
        isStream: false,
        provider: "anthropic",
        providerModelId: "claude-3-opus-20240229",
        responseFormat: "ANTHROPIC",
      });

      const parsed = JSON.parse(result);

      // Usage should be normalized to OpenAI format
      expect(parsed.usage).toBeDefined();
      expect(parsed.usage.prompt_tokens).toBe(75);
      expect(parsed.usage.completion_tokens).toBe(25);
      expect(parsed.usage.total_tokens).toBe(100);
    });
  });

  describe("Gemini response format", () => {
    it("should convert Gemini non-streaming responses to OpenAI format", async () => {
      const geminiResponse = {
        candidates: [
          {
            content: {
              role: "model",
              parts: [{ text: "Hello from Gemini!" }],
            },
            finishReason: "STOP",
          },
        ],
        modelVersion: "gemini-1.5-pro",
        usageMetadata: {
          promptTokenCount: 12,
          candidatesTokenCount: 8,
          totalTokenCount: 20,
        },
      };

      const result = await normalizeAIGatewayResponse({
        responseText: JSON.stringify(geminiResponse),
        isStream: false,
        provider: "vertex",
        providerModelId: "gemini-1.5-pro",
        responseFormat: "GOOGLE",
      });

      const parsed = JSON.parse(result);
      expect(parsed.object).toBe("chat.completion");
      expect(parsed.model).toBe("gemini-1.5-pro");
      expect(parsed.choices[0].message.content).toBe("Hello from Gemini!");
      expect(parsed.usage).toBeDefined();
      expect(parsed.usage.prompt_tokens).toBeGreaterThanOrEqual(0);
      expect(parsed.usage.completion_tokens).toBeGreaterThanOrEqual(0);
    });

    it("should convert Gemini streaming responses to OpenAI SSE format", async () => {
      const geminiStream = [
        'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}',
        'data: {"candidates":[{"content":{"parts":[{"text":" world"}]},"finishReason":"STOP"}],"usageMetadata":{"promptTokenCount":5,"candidatesTokenCount":3,"totalTokenCount":8}}',
        "data: [DONE]",
      ].join("\n\n");

      const result = await normalizeAIGatewayResponse({
        responseText: geminiStream,
        isStream: true,
        provider: "vertex",
        providerModelId: "gemini-1.5-pro",
        responseFormat: "GOOGLE",
      });

      expect(result).toContain('"object":"chat.completion.chunk"');
      expect(result).toContain('"content":"Hello"');
      expect(result).toContain('"content":" world"');
      expect(result).toContain('"finish_reason":"stop"');
      expect(result).toContain('"prompt_tokens":5');
      expect(result).toContain("data: [DONE]");
    });
  });
});
