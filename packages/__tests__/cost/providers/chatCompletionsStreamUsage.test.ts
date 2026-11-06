import { describe, expect, it } from "@jest/globals";
import { registry } from "../../../cost/models/registry";
import { buildRequestBody } from "../../../cost/models/provider-helpers";
import { OpenAIUsageProcessor } from "../../../cost/usage/openAIUsageProcessor";
import type { BodyMappingType, Endpoint } from "../../../cost/models/types";
import type { ModelProviderName } from "../../../cost/models/providers";

function endpointFor(model: string, provider: ModelProviderName): Endpoint {
  const configResult = registry.getModelProviderConfig(model, provider);
  if (!configResult.data) {
    throw new Error(
      configResult.error ?? `missing config ${model}:${provider}`,
    );
  }
  const endpointResult = registry.buildEndpoint(configResult.data, {});
  if (!endpointResult.data) {
    throw new Error(
      endpointResult.error ?? `missing endpoint ${model}:${provider}`,
    );
  }
  return endpointResult.data;
}

async function forwardedBody(
  endpoint: Endpoint,
  parsedBody: Record<string, unknown>,
  bodyMapping: BodyMappingType,
): Promise<Record<string, unknown>> {
  const result = await buildRequestBody(endpoint, {
    parsedBody,
    bodyMapping,
    toAnthropic: (body) => body,
    toChatCompletions: (body) => body,
  });
  if (!result.data) {
    throw new Error(result.error ?? "buildRequestBody failed");
  }
  return JSON.parse(result.data) as Record<string, unknown>;
}

describe("Chat Completions stream usage on NO_MAPPING", () => {
  const openAI = endpointFor("gpt-4o", "openai");
  const azure = endpointFor("gpt-4o", "azure");
  const anthropic = endpointFor("claude-3.7-sonnet", "anthropic");
  const groq = endpointFor("llama-3.3-70b-versatile", "groq");

  const chatBody = {
    model: "gpt-4o",
    messages: [{ role: "user", content: "Reply with OK." }],
    stream: true,
  };

  it("adds include_usage when an OpenAI stream omits it", async () => {
    const original = { ...chatBody, messages: [...chatBody.messages] };
    const body = await forwardedBody(openAI, original, "NO_MAPPING");

    expect(body.stream_options).toEqual({ include_usage: true });
    expect(body.model).toBe("gpt-4o");
    expect(original).not.toHaveProperty("stream_options");
  });

  it("adds include_usage for Azure OpenAI chat completions streams", async () => {
    const body = await forwardedBody(azure, chatBody, "NO_MAPPING");

    expect(body.stream_options).toEqual({ include_usage: true });
    expect(body.model).toBe("gpt-4o");
  });

  it("preserves other stream_options when include_usage was omitted", async () => {
    const body = await forwardedBody(
      openAI,
      {
        ...chatBody,
        stream_options: { include_obfuscation: true },
      },
      "NO_MAPPING",
    );

    expect(body.stream_options).toEqual({
      include_obfuscation: true,
      include_usage: true,
    });
  });

  it("leaves an explicit include_usage false unchanged", async () => {
    const body = await forwardedBody(
      openAI,
      {
        ...chatBody,
        stream_options: { include_usage: false, include_obfuscation: true },
      },
      "NO_MAPPING",
    );

    expect(body.stream_options).toEqual({
      include_usage: false,
      include_obfuscation: true,
    });
  });

  it("does not add stream_options to non-streaming OpenAI requests", async () => {
    const body = await forwardedBody(
      openAI,
      { ...chatBody, stream: false },
      "NO_MAPPING",
    );

    expect(body.stream).toBe(false);
    expect(body).not.toHaveProperty("stream_options");
  });

  it("does not add stream_options to Responses API bodies", async () => {
    const body = await forwardedBody(
      openAI,
      {
        model: "gpt-4o",
        input: "Reply with OK.",
        stream: true,
      },
      "RESPONSES",
    );

    expect(body.stream).toBe(true);
    expect(body).not.toHaveProperty("stream_options");
    expect(body.input).toBe("Reply with OK.");
  });

  it("does not add stream_options to native Anthropic streams", async () => {
    const original = {
      model: "claude-3-7-sonnet-20250219",
      messages: [{ role: "user", content: "Reply with OK." }],
      max_tokens: 32,
      stream: true,
    };
    const body = await forwardedBody(anthropic, original, "NO_MAPPING");

    expect(body.stream).toBe(true);
    expect(body.messages).toEqual(original.messages);
    expect(body.max_tokens).toBe(32);
    expect(body).not.toHaveProperty("stream_options");
    expect(original).not.toHaveProperty("stream_options");
  });

  it("does not treat a messages array as OpenAI when the provider is Groq", async () => {
    const body = await forwardedBody(
      groq,
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "Reply with OK." }],
        stream: true,
      },
      "NO_MAPPING",
    );

    expect(body.stream).toBe(true);
    expect(body.messages).toEqual([
      { role: "user", content: "Reply with OK." },
    ]);
    expect(body).not.toHaveProperty("stream_options");
  });
});

describe("OpenAI stream usage settlement input", () => {
  it("parses a stream with no usage chunk as zero tokens", async () => {
    const processor = new OpenAIUsageProcessor();
    const result = await processor.parse({
      model: "gpt-4o",
      isStream: true,
      responseBody: [
        'data: {"id":"chatcmpl-1","choices":[{"delta":{"content":"OK"}}]}',
        "",
        "data: [DONE]",
        "",
      ].join("\n"),
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ input: 0, output: 0 });
  });
});
