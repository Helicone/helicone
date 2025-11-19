import { describe, it, expect } from "vitest";
import { oaiChat2responsesResponse } from "../../src/lib/clients/llmmapper/router/oaiChat2responses/nonStream";
import { oaiChat2responsesStreamResponse } from "../../src/lib/clients/llmmapper/router/oaiChat2responses/stream";

describe("OpenAI Chat -> Responses response mappers", () => {
  it("should convert non-stream Chat JSON to Responses JSON", async () => {
    const chatJson = {
      id: "chatcmpl_nonstream_1",
      object: "chat.completion",
      created: 1730001000,
      model: "gpt-4o-mini",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Hi from chat",
            tool_calls: [
              {
                id: "call_1",
                type: "function",
                function: { name: "calc", arguments: "{\"x\":1}" },
              },
            ],
          },
          finish_reason: "tool_calls",
          logprobs: null,
        },
      ],
      usage: { prompt_tokens: 11, completion_tokens: 3, total_tokens: 14 },
    };

    const input = new Response(JSON.stringify(chatJson), {
      headers: { "content-type": "application/json" },
    });
    const out = await oaiChat2responsesResponse(input);
    const body = await out.json<any>();

    expect(out.headers.get("content-type")).toMatch(/application\/json/);
    expect(body.object).toBe("response");
    expect(body.output[0].role).toBe("assistant");
    expect(body.output[0].content[0]).toEqual({ type: "output_text", text: "Hi from chat" });
    const func = body.output.find((o: any) => o.type === "function_call");
    expect(func).toBeDefined();
    expect(func).toMatchObject({ call_id: "call_1", name: "calc", arguments: "{\"x\":1}" });
    expect(body.usage).toMatchObject({ input_tokens: 11, output_tokens: 3, total_tokens: 14 });
  });

  it("should convert stream Chat SSE to Responses SSE", async () => {
    const encoder = new TextEncoder();
    const chunks: string[] = [];

    // first chunk establishes assistant role
    chunks.push(
      `data: ${JSON.stringify({
        id: "cmpl_stream_resp_1",
        object: "chat.completion.chunk",
        created: 1730001100,
        model: "gpt-4o-mini",
        system_fingerprint: "",
        choices: [
          { index: 0, delta: { role: "assistant", content: "" }, logprobs: null, finish_reason: null },
        ],
      })}\n\n`
    );

    // text delta chunk + finish
    chunks.push(
      `data: ${JSON.stringify({
        id: "cmpl_stream_resp_1",
        object: "chat.completion.chunk",
        created: 1730001101,
        model: "gpt-4o-mini",
        system_fingerprint: "",
        choices: [
          { index: 0, delta: { content: "Hello" }, logprobs: null, finish_reason: "stop" },
        ],
      })}\n\n`
    );

    // final usage chunk
    chunks.push(
      `data: ${JSON.stringify({
        id: "cmpl_stream_resp_1",
        object: "chat.completion.chunk",
        created: 1730001102,
        model: "gpt-4o-mini",
        system_fingerprint: "",
        choices: [],
        usage: { prompt_tokens: 5, completion_tokens: 1, total_tokens: 6 },
      })}\n\n`
    );

    chunks.push("data: [DONE]\n\n");

    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(chunks.join("")));
        controller.close();
      },
    });

    const input = new Response(source, {
      headers: { "content-type": "text/event-stream; charset=utf-8" },
    });

    const out = oaiChat2responsesStreamResponse(input);
    const text = await out.text();

    expect(out.headers.get("content-type")).toMatch(/text\/event-stream/);
    expect(text).toContain("event: response.created");
    expect(text).toContain("event: response.output_text.delta");
    expect(text).toContain("event: response.output_text.done");
    expect(text).toContain("event: response.completed");
  });
});
