import { describe, it, expect } from "@jest/globals";
import { toResponses } from "../../llm-mapper/transform/providers/responses/openai/response/toResponses";
import { ChatToResponsesStreamConverter } from "../../llm-mapper/transform/providers/responses/streamedResponse/toResponses";
import { OpenAIResponseBody, ChatCompletionChunk } from "../../llm-mapper/transform/types/openai";
import { toChatCompletions } from "../../llm-mapper/transform/providers/responses/request/toChatCompletions";
import {
  ResponsesRequestBody,
  ResponseCompletedEvent,
  ResponseOutputTextDeltaEvent,
  ResponsesFunctionCallOutputItem,
  ResponsesMessageOutputItem,
} from "../../llm-mapper/transform/types/responses";

describe("OpenAI Chat -> Responses converters", () => {
  describe("toResponses (non-stream)", () => {
    it("maps basic assistant message content and usage", () => {
      const body: OpenAIResponseBody = {
        id: "chatcmpl_1",
        object: "chat.completion",
        created: 1730000000,
        model: "gpt-4o-mini",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Hello from Chat Completions!",
            },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };

      const res = toResponses(body);
      expect(res.object).toBe("response");
      expect(res.output).toHaveLength(1);
      const msg = res.output[0] as ResponsesMessageOutputItem;
      expect(msg.type).toBe("message");
      expect(msg.role).toBe("assistant");
      expect(msg.content).toEqual([
        { type: "output_text", text: "Hello from Chat Completions!", annotations: [] },
      ]);
      expect(res.usage?.input_tokens).toBe(10);
      expect(res.usage?.output_tokens).toBe(5);
    });

    it("maps tool_calls to function_call output items", () => {
      const body: OpenAIResponseBody = {
        id: "chatcmpl_2",
        object: "chat.completion",
        created: 1730000001,
        model: "gpt-4o-mini",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Calculating...",
              tool_calls: [
                {
                  id: "call_123",
                  type: "function",
                  function: { name: "calculate", arguments: "{\"x\":2}" },
                },
              ],
            },
            finish_reason: "tool_calls",
            logprobs: null,
          },
        ],
        usage: {
          prompt_tokens: 20,
          completion_tokens: 3,
          total_tokens: 23,
        },
      };

      const res = toResponses(body);
      // Expect one message item and one function_call item
      expect(res.output.length).toBe(2);
      const msg = res.output.find((o: any) => o.type === "message") as any;
      const func = res.output.find((o: any) => o.type === "function_call") as any;
      expect(msg).toBeDefined();
      expect(msg.content).toEqual([
        { type: "output_text", text: "Calculating...", annotations: [] },
      ]);
      expect(func).toBeDefined();
      expect(func).toMatchObject({
        type: "function_call",
        name: "calculate",
        call_id: "call_123",
        arguments: "{\"x\":2}",
      });
    });
  });

  describe("ChatToResponsesStreamConverter (stream)", () => {
    it("emits created, deltas, done, and completed with usage", () => {
      const conv = new ChatToResponsesStreamConverter();
      const chunks: ChatCompletionChunk[] = [];

      // initial chunk with role
      chunks.push({
        id: "cmpl_stream_1",
        object: "chat.completion.chunk",
        created: 1730000100,
        model: "gpt-4o-mini",
        system_fingerprint: "",
        choices: [
          {
            index: 0,
            delta: { role: "assistant", content: "" },
            logprobs: null,
            finish_reason: null,
          },
        ],
      });

      // text deltas
      chunks.push({
        id: "cmpl_stream_1",
        object: "chat.completion.chunk",
        created: 1730000101,
        model: "gpt-4o-mini",
        system_fingerprint: "",
        choices: [
          { index: 0, delta: { content: "Hello" }, logprobs: null, finish_reason: null },
        ],
      });
      chunks.push({
        id: "cmpl_stream_1",
        object: "chat.completion.chunk",
        created: 1730000102,
        model: "gpt-4o-mini",
        system_fingerprint: "",
        choices: [
          { index: 0, delta: { content: " world" }, logprobs: null, finish_reason: "stop" },
        ],
      });

      // final usage chunk
      chunks.push({
        id: "cmpl_stream_1",
        object: "chat.completion.chunk",
        created: 1730000103,
        model: "gpt-4o-mini",
        system_fingerprint: "",
        choices: [],
        usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 },
      });

      const events = chunks.flatMap((c) => conv.convert(c));

      expect(events[0].type).toBe("response.created");
      const deltas = events.filter(
        (e): e is ResponseOutputTextDeltaEvent => e.type === "response.output_text.delta"
      );
      expect(deltas.map((d) => d.delta).join("")).toBe("Hello world");
      expect(events.some((e) => e.type === "response.output_text.done")).toBe(true);
      const completed = events.find(
        (e): e is ResponseCompletedEvent => e.type === "response.completed"
      );
      expect(completed).toBeDefined();
      if (!completed) throw new Error("missing completed");
      const firstMsg = completed.response.output.find((o) => (o as any).type === "message") as any;
      expect(firstMsg.content[0]).toEqual({
        type: "output_text",
        text: "Hello world",
        annotations: [],
      });
      expect(completed.response.usage).toBeDefined();
      expect(completed.response.usage?.input_tokens).toBe(10);
      expect(completed.response.usage?.output_tokens).toBe(2);
    });

    it("accumulates streamed tool call arguments", () => {
      const conv = new ChatToResponsesStreamConverter();
      const chunks: ChatCompletionChunk[] = [];

      // start
      chunks.push({
        id: "cmpl_stream_2",
        object: "chat.completion.chunk",
        created: 1730000200,
        model: "gpt-4o-mini",
        system_fingerprint: "",
        choices: [
          { index: 0, delta: { role: "assistant" }, logprobs: null, finish_reason: null },
        ],
      });

      // tool_calls stream
      chunks.push({
        id: "cmpl_stream_2",
        object: "chat.completion.chunk",
        created: 1730000201,
        model: "gpt-4o-mini",
        system_fingerprint: "",
        choices: [
          {
            index: 0,
            delta: {
              tool_calls: [
                { index: 0, id: "call_1", type: "function", function: { name: "calc" } },
              ],
            },
            logprobs: null,
            finish_reason: null,
          },
        ],
      });
      chunks.push({
        id: "cmpl_stream_2",
        object: "chat.completion.chunk",
        created: 1730000202,
        model: "gpt-4o-mini",
        system_fingerprint: "",
        choices: [
          {
            index: 0,
            delta: {
              tool_calls: [
                { index: 0, id: "call_1", type: "function", function: { arguments: "{\"x\":1}" } },
              ],
            },
            logprobs: null,
            finish_reason: null,
          },
        ],
      });
      // finish token
      chunks.push({
        id: "cmpl_stream_2",
        object: "chat.completion.chunk",
        created: 1730000203,
        model: "gpt-4o-mini",
        system_fingerprint: "",
        choices: [],
        usage: { prompt_tokens: 5, completion_tokens: 1, total_tokens: 6 },
      });

      const events = chunks.flatMap((c) => conv.convert(c));
      const completed = events.find(
        (e): e is ResponseCompletedEvent => e.type === "response.completed"
      );
      expect(completed).toBeDefined();
      if (!completed) throw new Error("missing completed");
      const funcItem = completed.response.output.find(
        (o): o is ResponsesFunctionCallOutputItem => (o as any).type === "function_call"
      );
      expect(funcItem).toBeDefined();
      expect(funcItem).toMatchObject({
        call_id: "call_1",
        name: "calc",
        arguments: "{\"x\":1}",
      });
    });
  });

  describe("toChatCompletions (request mapping)", () => {
    it("maps instructions + input string to system+user messages", () => {
      const req: ResponsesRequestBody = {
        model: "gpt-4o-mini",
        instructions: "You are helpful",
        input: "Hello",
      };
      const oai = toChatCompletions(req);
      expect(oai.messages?.[0]).toEqual({ role: "system", content: "You are helpful" });
      expect(oai.messages?.[1]).toEqual({ role: "user", content: "Hello" });
    });

    it("maps function_call and function_call_output items", () => {
      const req: ResponsesRequestBody = {
        model: "gpt-4o-mini",
        input: [
          { type: "message", role: "user", content: "What is 2+2?" },
          { type: "function_call", id: "call_1", name: "calc", arguments: "{\"x\":2}" },
          { type: "function_call_output", call_id: "call_1", output: "4" },
        ],
      };
      const oai = toChatCompletions(req);
      expect(oai.messages?.[0]).toEqual({ role: "user", content: "What is 2+2?" });
      // assistant tool_calls message
      const assistant = oai.messages?.[1] as any;
      expect(assistant.role).toBe("assistant");
      expect(assistant.tool_calls?.[0]).toMatchObject({ id: "call_1", type: "function" });
      // tool result message
      const tool = oai.messages?.[2] as any;
      expect(tool.role).toBe("tool");
      expect(tool.tool_call_id).toBe("call_1");
      expect(tool.content).toBe("4");
    });

    it("maps Responses tools (flattened) to Chat tools (nested)", () => {
      const req = {
        model: "gpt-4o-mini",
        input: "hello",
        tools: [
          {
            type: "function",
            name: "calculate",
            description: "do math",
            parameters: { type: "object", properties: {}, required: [] },
          },
        ],
        tool_choice: "auto",
      } as unknown as ResponsesRequestBody;

      const oai = toChatCompletions(req);
      expect(Array.isArray(oai.tools)).toBe(true);
      const tool = (oai.tools as any[])[0];
      expect(tool).toEqual({
        type: "function",
        function: {
          name: "calculate",
          description: "do math",
          parameters: { type: "object", properties: {}, required: [] },
        },
      });
    });

    it("accepts assistant message with output_text in input and maps to text", () => {
      const req = {
        model: "gpt-4o-mini",
        input: [
          { role: "user", content: [{ type: "input_text", text: "Hello" }] },
          {
            type: "message",
            role: "assistant",
            content: [{ type: "output_text", text: "Hi there" }],
          },
        ],
      } as unknown as ResponsesRequestBody;

      const oai = toChatCompletions(req);
      expect(oai.messages?.length).toBe(2);
      const assistant = oai.messages?.[1];
      expect(assistant?.role).toBe("assistant");
      // Either string or content parts with text are acceptable; normalize to string or array of text parts
      if (typeof assistant?.content === "string") {
        expect(assistant.content).toBe("Hi there");
      } else {
        expect(Array.isArray(assistant?.content)).toBe(true);
        const textPart = (assistant?.content as any[])[0];
        expect(textPart).toMatchObject({ type: "text", text: "Hi there" });
      }
    });

    it("maps text.format json_schema to response_format", () => {
      const req: ResponsesRequestBody = {
        model: "gpt-4o-mini",
        input: "Generate a JSON object with name and age",
        text: {
          format: {
            type: "json_schema",
            json_schema: {
              name: "person",
              description: "A person object",
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  age: { type: "number" },
                },
                required: ["name", "age"],
              },
              strict: true,
            },
          },
        },
      };
      const oai = toChatCompletions(req);
      expect(oai.response_format).toBeDefined();
      expect(oai.response_format?.type).toBe("json_schema");
      expect((oai.response_format as any)?.json_schema).toEqual({
        name: "person",
        description: "A person object",
        schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
          },
          required: ["name", "age"],
        },
        strict: true,
      });
    });

    it("maps text.format json_object to response_format", () => {
      const req: ResponsesRequestBody = {
        model: "gpt-4o-mini",
        input: "Generate a JSON response",
        text: {
          format: {
            type: "json_object",
          },
        },
      };
      const oai = toChatCompletions(req);
      expect(oai.response_format).toBeDefined();
      expect(oai.response_format?.type).toBe("json_object");
      expect((oai.response_format as any)?.json_schema).toBeUndefined();
    });

    it("maps text.format text type to response_format", () => {
      const req: ResponsesRequestBody = {
        model: "gpt-4o-mini",
        input: "Hello",
        text: {
          format: {
            type: "text",
          },
        },
      };
      const oai = toChatCompletions(req);
      expect(oai.response_format).toBeDefined();
      expect(oai.response_format?.type).toBe("text");
    });

    it("does not set response_format when text.format is not provided", () => {
      const req: ResponsesRequestBody = {
        model: "gpt-4o-mini",
        input: "Hello",
        text: {
          verbosity: "high",
        },
      };
      const oai = toChatCompletions(req);
      expect(oai.response_format).toBeUndefined();
    });

    it("does not set response_format when text is not provided", () => {
      const req: ResponsesRequestBody = {
        model: "gpt-4o-mini",
        input: "Hello",
      };
      const oai = toChatCompletions(req);
      expect(oai.response_format).toBeUndefined();
    });

    it("preserves text.verbosity separately from text.format", () => {
      const req: ResponsesRequestBody = {
        model: "gpt-4o-mini",
        input: "Generate JSON",
        text: {
          format: {
            type: "json_schema",
            json_schema: {
              name: "test",
              schema: { type: "object" },
            },
          },
          verbosity: "medium",
        },
      };
      const oai = toChatCompletions(req);
      // response_format should be set from text.format
      expect(oai.response_format).toBeDefined();
      expect(oai.response_format?.type).toBe("json_schema");
      // Note: verbosity is not directly mapped to Chat Completions API
      // but the response_format should still work correctly
    });
  });

  describe("fromChatCompletions (request mapping)", () => {
    // Import here to ensure test file picks it up
    const { fromChatCompletions } = require("../../llm-mapper/transform/providers/responses/request/fromChatCompletions");

    it("maps system message to developer role and user message to input array", () => {
      const chatParams = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are helpful" },
          { role: "user", content: "Hello" },
        ],
      };

      const res = fromChatCompletions(chatParams);
      expect(res.model).toBe("gpt-4o-mini");
      // System messages become developer role in input array (mimics Chat Completions structure)
      expect(res.instructions).toBeUndefined();
      expect(Array.isArray(res.input)).toBe(true);
      expect((res.input as any[]).length).toBe(2);
      expect((res.input as any[])[0]).toMatchObject({ type: "message", role: "developer", content: "You are helpful" });
      expect((res.input as any[])[1]).toMatchObject({ type: "message", role: "user", content: "Hello" });
    });

    it("maps multiple messages to input array with system as developer", () => {
      const chatParams = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are helpful" },
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there!" },
          { role: "user", content: "How are you?" },
        ],
      };

      const res = fromChatCompletions(chatParams);
      // System messages become developer role (no instructions extraction)
      expect(res.instructions).toBeUndefined();
      expect(Array.isArray(res.input)).toBe(true);
      expect((res.input as any[]).length).toBe(4);
      expect((res.input as any[])[0]).toMatchObject({ type: "message", role: "developer", content: "You are helpful" });
      expect((res.input as any[])[1]).toMatchObject({ type: "message", role: "user", content: "Hello" });
      expect((res.input as any[])[2]).toMatchObject({ type: "message", role: "assistant", content: "Hi there!" });
      expect((res.input as any[])[3]).toMatchObject({ type: "message", role: "user", content: "How are you?" });
    });

    it("maps tool_calls to function_call items", () => {
      const chatParams = {
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: "What is 2+2?" },
          {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "call_123",
                type: "function",
                function: { name: "calculate", arguments: "{\"x\":2}" },
              },
            ],
          },
        ],
      };

      const res = fromChatCompletions(chatParams);
      expect(Array.isArray(res.input)).toBe(true);
      const funcCall = (res.input as any[]).find((i: any) => i.type === "function_call");
      expect(funcCall).toBeDefined();
      expect(funcCall).toMatchObject({
        type: "function_call",
        call_id: "call_123",
        name: "calculate",
        arguments: "{\"x\":2}",
      });
    });

    it("maps tool messages to function_call_output items", () => {
      const chatParams = {
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: "What is 2+2?" },
          {
            role: "tool",
            tool_call_id: "call_123",
            content: "4",
          },
        ],
      };

      const res = fromChatCompletions(chatParams);
      expect(Array.isArray(res.input)).toBe(true);
      const funcOutput = (res.input as any[]).find((i: any) => i.type === "function_call_output");
      expect(funcOutput).toBeDefined();
      expect(funcOutput).toMatchObject({
        type: "function_call_output",
        call_id: "call_123",
        output: "4",
      });
    });

    it("maps Chat tools (nested) to Responses tools (flattened)", () => {
      const chatParams = {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Hello" }],
        tools: [
          {
            type: "function",
            function: {
              name: "calculate",
              description: "do math",
              parameters: { type: "object", properties: {}, required: [] },
            },
          },
        ],
      };

      const res = fromChatCompletions(chatParams);
      expect(Array.isArray(res.tools)).toBe(true);
      expect(res.tools?.[0]).toMatchObject({
        type: "function",
        name: "calculate",
        description: "do math",
        parameters: { type: "object", properties: {}, required: [] },
      });
    });

    it("maps content array with text parts to input_text", () => {
      const chatParams = {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Describe this image" },
              { type: "image_url", image_url: { url: "https://example.com/img.jpg", detail: "high" } },
            ],
          },
        ],
      };

      const res = fromChatCompletions(chatParams);
      expect(Array.isArray(res.input)).toBe(true);
      const msg = (res.input as any[])[0];
      expect(msg.type).toBe("message");
      expect(msg.role).toBe("user");
      expect(Array.isArray(msg.content)).toBe(true);
      expect(msg.content[0]).toMatchObject({ type: "input_text", text: "Describe this image" });
      expect(msg.content[1]).toMatchObject({ type: "input_image", image_url: "https://example.com/img.jpg", detail: "high" });
    });

    it("preserves Responses-specific fields from original request", () => {
      const chatParams = {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Hello" }],
      };
      const originalResponsesBody = {
        reasoning: { effort: "high" as const },
        metadata: { key: "value" },
        store: true,
        truncation: "auto" as const,
      };

      const res = fromChatCompletions(chatParams, originalResponsesBody);
      expect(res.reasoning).toEqual({ effort: "high" });
      expect(res.metadata).toEqual({ key: "value" });
      expect(res.store).toBe(true);
      expect(res.truncation).toBe("auto");
    });

    it("round-trips: toChatCompletions then fromChatCompletions preserves structure", () => {
      const original: ResponsesRequestBody = {
        model: "gpt-4o-mini",
        instructions: "You are helpful",
        input: [
          { type: "message", role: "user", content: "Hello" },
          { type: "message", role: "assistant", content: "Hi there!" },
        ],
        temperature: 0.7,
        max_output_tokens: 1000,
      };

      const chat = toChatCompletions(original);
      const roundTripped = fromChatCompletions(chat, original);

      expect(roundTripped.model).toBe(original.model);
      // Instructions are preserved from originalResponsesBody parameter
      expect(roundTripped.instructions).toBe(original.instructions);
      expect(roundTripped.temperature).toBe(original.temperature);
      expect(roundTripped.max_output_tokens).toBe(original.max_output_tokens);
      // Input structure includes system message converted to developer role
      // Original: instructions + 2 input messages -> Chat: 3 messages -> Responses: 3 input items
      expect(Array.isArray(roundTripped.input)).toBe(true);
      expect((roundTripped.input as any[]).length).toBe(3);
      expect((roundTripped.input as any[])[0]).toMatchObject({ type: "message", role: "developer", content: "You are helpful" });
      expect((roundTripped.input as any[])[1]).toMatchObject({ type: "message", role: "user", content: "Hello" });
      expect((roundTripped.input as any[])[2]).toMatchObject({ type: "message", role: "assistant", content: "Hi there!" });
    });
  });
});
