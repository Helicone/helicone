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
        { type: "output_text", text: "Hello from Chat Completions!" },
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
        { type: "output_text", text: "Calculating..." },
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
  });
});
