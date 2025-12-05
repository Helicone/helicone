import { describe, expect, it } from "@jest/globals";
import { AnthropicToOpenAIStreamConverter } from "../../llm-mapper/transform/providers/anthropic/streamedResponse/toOpenai";
import { toOpenAI } from "../../llm-mapper/transform/providers/anthropic/response/toOpenai";

describe("AnthropicToOpenAIStreamConverter - Cache Token Handling", () => {
  it("should include cache_creation_input_tokens in prompt_tokens", () => {
    const converter = new AnthropicToOpenAIStreamConverter();

    // Simulated Anthropic stream with cache_creation_input_tokens
    // This is based on a real production request that was incorrectly showing prompt_tokens: 4
    const nativeResponse = `event: message_start
data: {"type":"message_start","message":{"model":"claude-3-5-haiku","id":"test-id","type":"message","role":"assistant","content":[],"stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":4,"cache_creation_input_tokens":51713,"cache_read_input_tokens":0,"output_tokens":4}}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello world"}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn","stop_sequence":null},"usage":{"output_tokens":813}}

event: message_stop
data: {"type":"message_stop"}`;

    const chunks: any[] = [];
    converter.processLines(nativeResponse, (chunk) => {
      chunks.push(chunk);
    });

    // Find the final chunk with usage
    const usageChunk = chunks.find((c) => c.usage);
    expect(usageChunk).toBeDefined();

    // The bug: prompt_tokens was only 4 (input_tokens), ignoring cache_creation_input_tokens (51713)
    // Expected: prompt_tokens should be 4 + 51713 = 51717
    expect(usageChunk.usage.prompt_tokens).toBe(4 + 51713);
    expect(usageChunk.usage.total_tokens).toBe(4 + 51713 + 813);

    // Cache details should still be preserved
    expect(usageChunk.usage.prompt_tokens_details?.cache_write_tokens).toBe(
      51713
    );
  });

  it("should include cache_read_input_tokens in prompt_tokens", () => {
    const converter = new AnthropicToOpenAIStreamConverter();

    // Simulated Anthropic stream with cache_read_input_tokens (cache hit)
    const nativeResponse = `event: message_start
data: {"type":"message_start","message":{"model":"claude-3-5-haiku","id":"test-id","type":"message","role":"assistant","content":[],"stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":4,"cache_creation_input_tokens":0,"cache_read_input_tokens":51713,"output_tokens":4}}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello world"}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn","stop_sequence":null},"usage":{"output_tokens":100}}

event: message_stop
data: {"type":"message_stop"}`;

    const chunks: any[] = [];
    converter.processLines(nativeResponse, (chunk) => {
      chunks.push(chunk);
    });

    const usageChunk = chunks.find((c) => c.usage);
    expect(usageChunk).toBeDefined();

    // prompt_tokens should include cache_read_input_tokens
    // Total input = 4 (new) + 51713 (cached) = 51717
    expect(usageChunk.usage.prompt_tokens).toBe(4 + 51713);
    expect(usageChunk.usage.total_tokens).toBe(4 + 51713 + 100);
    expect(usageChunk.usage.prompt_tokens_details?.cached_tokens).toBe(51713);
  });

  it("should handle requests with no caching", () => {
    const converter = new AnthropicToOpenAIStreamConverter();

    const nativeResponse = `event: message_start
data: {"type":"message_start","message":{"model":"claude-3-5-haiku","id":"test-id","type":"message","role":"assistant","content":[],"stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":1000,"output_tokens":4}}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn","stop_sequence":null},"usage":{"output_tokens":50}}

event: message_stop
data: {"type":"message_stop"}`;

    const chunks: any[] = [];
    converter.processLines(nativeResponse, (chunk) => {
      chunks.push(chunk);
    });

    const usageChunk = chunks.find((c) => c.usage);
    expect(usageChunk).toBeDefined();

    // No caching, so prompt_tokens should just be input_tokens
    expect(usageChunk.usage.prompt_tokens).toBe(1000);
    expect(usageChunk.usage.total_tokens).toBe(1000 + 50);
  });
});

describe("toOpenAI (non-streaming) - Cache Token Handling", () => {
  it("should include cache_creation_input_tokens in prompt_tokens", () => {
    const anthropicResponse = {
      id: "test-id",
      type: "message" as const,
      role: "assistant" as const,
      model: "claude-3-5-haiku",
      content: [{ type: "text" as const, text: "Hello world" }],
      stop_reason: "end_turn" as const,
      stop_sequence: null,
      usage: {
        input_tokens: 4,
        output_tokens: 100,
        cache_creation_input_tokens: 51713,
        cache_read_input_tokens: 0,
      },
    };

    const result = toOpenAI(anthropicResponse);

    // prompt_tokens should be input_tokens + cache_creation_input_tokens
    expect(result.usage.prompt_tokens).toBe(4 + 51713);
    expect(result.usage.total_tokens).toBe(4 + 51713 + 100);
    expect(result.usage.prompt_tokens_details?.cache_write_tokens).toBe(51713);
  });

  it("should include cache_read_input_tokens in prompt_tokens", () => {
    const anthropicResponse = {
      id: "test-id",
      type: "message" as const,
      role: "assistant" as const,
      model: "claude-3-5-haiku",
      content: [{ type: "text" as const, text: "Hello world" }],
      stop_reason: "end_turn" as const,
      stop_sequence: null,
      usage: {
        input_tokens: 4,
        output_tokens: 100,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 51713,
      },
    };

    const result = toOpenAI(anthropicResponse);

    // prompt_tokens should be input_tokens + cache_read_input_tokens
    expect(result.usage.prompt_tokens).toBe(4 + 51713);
    expect(result.usage.total_tokens).toBe(4 + 51713 + 100);
    expect(result.usage.prompt_tokens_details?.cached_tokens).toBe(51713);
  });
});
