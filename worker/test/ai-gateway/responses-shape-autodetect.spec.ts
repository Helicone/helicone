import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";
import { setSupabaseTestCase } from "../setup";
import { clearProviderKeysInMemoryCache } from "../../src/lib/util/cache/inMemoryCache";

// Reproduces the exact payload from Helicone issue #5629: Cursor IDE posts a
// Responses-API-shaped body (input + tools, no messages) to the gateway's
// /v1/chat/completions endpoint. Before the fix the gateway forwarded the body
// verbatim to OpenAI's /v1/chat/completions and OpenAI rejected it with
// "Missing required parameter: 'messages'". After the fix the gateway detects
// the Responses shape, routes through the Responses path, and rewrites the URL
// to /v1/responses.
const CURSOR_REQUEST_BODY = {
  user: "749e7a5cc7708987",
  model: "gpt-4o-mini",
  input: [
    { role: "user", content: [{ type: "text", text: "Hello from Cursor" }] },
  ],
  tools: [
    {
      type: "function",
      name: "noop",
      description: "No-op tool",
      parameters: { type: "object", properties: {}, required: [] },
    },
  ],
  store: false,
  stream: false,
  metadata: {
    cursorRequestId: "",
    cursorConversationId: "3c105f79-6c0c-45a6-b43b-3a885ad6c14a",
  },
  stream_options: { include_usage: true },
};

describe("AI Gateway request-shape auto-detection (issue #5629)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearProviderKeysInMemoryCache();
  });

  afterEach(() => {
    setSupabaseTestCase(undefined);
  });

  it("routes BYOK Responses-shaped bodies to OpenAI /v1/responses", async () => {
    setSupabaseTestCase({ byokEnabled: true, creditsEnabled: false });

    const { response, calls } = await runGatewayTest({
      model: "gpt-4o-mini/openai",
      request: {
        // Override the default messages body with the Responses-shaped payload
        // from the issue. The test framework normally posts to
        // /v1/chat/completions; after auto-detection the gateway should
        // rewrite the upstream URL to /v1/responses.
        body: CURSOR_REQUEST_BODY,
      },
      expected: {
        providers: [
          {
            url: "https://api.openai.com/v1/responses",
            response: "success",
            model: "gpt-4o-mini",
            expects: {
              headers: {
                Authorization: "Bearer test-openai-api-key",
              },
            },
          },
        ],
        finalStatus: 200,
      },
    });

    expect(calls).toHaveLength(1);
    expect(response.status).toBe(200);
  });

  it("honors explicit Helicone-Gateway-Body-Mapping: OPENAI for Responses bodies", async () => {
    setSupabaseTestCase({ byokEnabled: true, creditsEnabled: false });

    // If the caller explicitly opts out of the auto-detection, the gateway
    // must keep the original chat-completions URL and validate the body
    // against the Chat Completions schema. With a Responses body that means
    // a clear 400 instead of leaking OpenAI's "Missing required parameter:
    // 'messages'" error back to the caller.
    const { response } = await runGatewayTest({
      model: "gpt-4o-mini/openai",
      request: {
        body: CURSOR_REQUEST_BODY,
        bodyMapping: "OPENAI",
      },
      expected: {
        providers: [],
        finalStatus: 400,
      },
    });

    const body = (await response.json()) as any;
    expect(body.error).toContain("messages");
    expect(body.error).toContain(
      "https://docs.helicone.ai/rest/ai-gateway/post-v1-chat-completions"
    );
  });

  it("honors explicit Helicone-Gateway-Body-Mapping: RESPONSES for Responses bodies", async () => {
    setSupabaseTestCase({ byokEnabled: true, creditsEnabled: false });

    const { response, calls } = await runGatewayTest({
      model: "gpt-4o-mini/openai",
      request: {
        body: CURSOR_REQUEST_BODY,
        bodyMapping: "RESPONSES",
      },
      expected: {
        providers: [
          {
            url: "https://api.openai.com/v1/responses",
            response: "success",
            model: "gpt-4o-mini",
          },
        ],
        finalStatus: 200,
      },
    });

    expect(calls).toHaveLength(1);
    expect(response.status).toBe(200);
  });

  it("does not auto-detect Chat Completions bodies", async () => {
    setSupabaseTestCase({ byokEnabled: true, creditsEnabled: false });

    // A request that already has `messages` must stay on the chat-completions
    // path. Auto-detection should be a no-op for the default case.
    const { response, calls } = await runGatewayTest({
      model: "gpt-4o-mini/openai",
      request: {
        messages: [{ role: "user", content: "Hi" }],
      },
      expected: {
        providers: [
          {
            url: "https://api.openai.com/v1/chat/completions",
            response: "success",
            model: "gpt-4o-mini",
          },
        ],
        finalStatus: 200,
      },
    });

    expect(calls).toHaveLength(1);
    expect(response.status).toBe(200);
  });

  it("validates PTB Responses-shaped bodies before forwarding", async () => {
    setSupabaseTestCase({ byokEnabled: false, creditsEnabled: true });

    // The Responses schema requires `input` to be a non-empty string or
    // array. An empty array must fail validation for PTB just like it does
    // for BYOK, and the gateway must return the schema error instead of
    // forwarding a malformed body to the provider.
    const { response } = await runGatewayTest({
      model: "gpt-4o-mini/openai",
      request: {
        body: {
          ...CURSOR_REQUEST_BODY,
          input: [],
        },
      },
      expected: {
        providers: [],
        finalStatus: 400,
      },
    });

    const body = (await response.json()) as any;
    expect(body.error.toLowerCase()).toContain("input");
    expect(body.error).toContain(
      "https://docs.helicone.ai/rest/ai-gateway/post-v1-responses"
    );
  });
});