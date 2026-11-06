import { beforeEach, describe, it, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";

describe("NO_MAPPING streaming usage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds include_usage for OpenAI chat completions streams", () =>
    runGatewayTest({
      model: "gpt-4o/openai",
      request: {
        bodyMapping: "NO_MAPPING",
        stream: true,
        messages: [{ role: "user", content: "Reply with OK." }],
      },
      expected: {
        providers: [
          {
            url: "https://api.openai.com/v1/chat/completions",
            response: "success",
            model: "gpt-4o",
            expects: {
              bodyContains: ['"stream":true', '"include_usage":true'],
            },
          },
        ],
        finalStatus: 200,
      },
    }));

  it("keeps other stream_options and an explicit include_usage false", () =>
    runGatewayTest({
      model: "gpt-4o/openai",
      request: {
        bodyMapping: "NO_MAPPING",
        stream: true,
        messages: [{ role: "user", content: "Reply with OK." }],
        body: {
          stream_options: {
            include_obfuscation: true,
            include_usage: false,
          },
        },
      },
      expected: {
        providers: [
          {
            url: "https://api.openai.com/v1/chat/completions",
            response: "success",
            model: "gpt-4o",
            expects: {
              bodyContains: [
                '"include_obfuscation":true',
                '"include_usage":false',
              ],
              bodyDoesNotContain: ['"include_usage":true'],
            },
          },
        ],
        finalStatus: 200,
      },
    }));

  it("does not add stream_options to non-streaming OpenAI requests", () =>
    runGatewayTest({
      model: "gpt-4o/openai",
      request: {
        bodyMapping: "NO_MAPPING",
        stream: false,
        messages: [{ role: "user", content: "Reply with OK." }],
      },
      expected: {
        providers: [
          {
            url: "https://api.openai.com/v1/chat/completions",
            response: "success",
            model: "gpt-4o",
            expects: {
              bodyContains: ['"stream":false'],
              bodyDoesNotContain: ["stream_options"],
            },
          },
        ],
        finalStatus: 200,
      },
    }));

  it("does not add stream_options to native Anthropic streams", () =>
    runGatewayTest({
      model: "claude-3-7-sonnet-20250219/anthropic",
      request: {
        bodyMapping: "NO_MAPPING",
        stream: true,
        messages: [{ role: "user", content: "Reply with OK." }],
        body: {
          max_tokens: 32,
        },
      },
      expected: {
        providers: [
          {
            url: "https://api.anthropic.com/v1/messages",
            response: "success",
            model: "claude-3-7-sonnet-20250219",
            data: {
              id: "msg_test",
              type: "message",
              role: "assistant",
              content: [{ type: "text", text: "OK" }],
              model: "claude-3-7-sonnet-20250219",
              usage: { input_tokens: 10, output_tokens: 2 },
            },
            expects: {
              bodyContains: ['"stream":true', '"messages"'],
              bodyDoesNotContain: ["stream_options"],
            },
          },
        ],
        finalStatus: 200,
      },
    }));

  it("still forces include_usage for default OpenAI body mapping", () =>
    runGatewayTest({
      model: "gpt-4o/openai",
      request: {
        stream: true,
        messages: [{ role: "user", content: "Reply with OK." }],
      },
      expected: {
        providers: [
          {
            url: "https://api.openai.com/v1/chat/completions",
            response: "success",
            model: "gpt-4o",
            expects: {
              bodyContains: ['"include_usage":true'],
            },
          },
        ],
        finalStatus: 200,
      },
    }));
});
