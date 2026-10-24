import { env } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RequestWrapper } from "../../src/lib/RequestWrapper";
import { RequestBodyBuffer_InMemory } from "../../src/RequestBodyBuffer/RequestBodyBuffer_InMemory";
import { DBLoggable } from "../../src/lib/dbLogger/DBLoggable";
import { parseOpenAIStream } from "../../src/lib/dbLogger/streamParsers/openAIStreamParser";
import { anthropicAIStream } from "../../src/lib/dbLogger/streamParsers/anthropicStreamParser";
import { parseVercelStream } from "../../src/lib/dbLogger/streamParsers/vercelStreamParser";

afterEach(() => vi.restoreAllMocks());

describe("invalid JSON logging", () => {
  it("does not put a request body or parser excerpt in Worker logs", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const body = '{"prompt":"customer-secret-marker"';
    const request = new Request("https://oai.helicone.ai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    const wrapper = await RequestWrapper.create(request, {
      ...env,
      ENVIRONMENT: "production",
      DATADOG_ENABLED: "false",
    } as Env);

    expect(wrapper.error).toBeNull();
    expect(await wrapper.data?.unsafeGetJson()).toEqual({});
    expect(log).toHaveBeenCalledWith(
      "RequestWrapper.getJson: invalid JSON body"
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain(
      "customer-secret-marker"
    );
  });

  it("does not log provider request bodies while reading model metadata", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const body = '{"model":"customer-secret-marker"';
    const request = new Request("https://oai.helicone.ai/v1/chat/completions", {
      method: "POST",
      body,
    });
    const buffer = new RequestBodyBuffer_InMemory(request, undefined, env);

    expect(await buffer.model()).toBe("unknown");
    expect(log).toHaveBeenCalledWith(
      "RequestBodyBuffer.getJson: invalid JSON body"
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain(
      "customer-secret-marker"
    );
  });

  it("does not log or rethrow body excerpts when an override fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const body = '{"prompt":"customer-secret-marker"';
    const request = new Request("https://oai.helicone.ai/v1/chat/completions", {
      method: "POST",
      body,
    });
    const buffer = new RequestBodyBuffer_InMemory(request, undefined, env);

    await expect(buffer.setBodyOverride({ model: "test" })).rejects.toThrow(
      "Failed to apply body override"
    );
    expect(log).toHaveBeenCalledWith("Failed to apply body override");
    expect(JSON.stringify(log.mock.calls)).not.toContain(
      "customer-secret-marker"
    );
  });

  it("does not log malformed provider responses or return their text in errors", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const loggable = new DBLoggable({
      response: { status: async () => 200 },
      request: {
        provider: "OPENAI",
        requestBodyBuffer: {
          isStream: async () => false,
          model: async () => "test-model",
        },
      },
      timing: {},
      tokenCalcUrl: "",
    } as unknown as ConstructorParameters<typeof DBLoggable>[0]);

    const result = await loggable.parseResponse(
      '{"content":"customer-secret-marker"',
      200
    );
    expect(result.error).toBe("error parsing provider response");
    expect(JSON.stringify(log.mock.calls)).not.toContain(
      "customer-secret-marker"
    );
  });

  it("does not log malformed stream lines containing customer output", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const invalidLine = 'data: {"content":"customer-secret-marker"';

    await parseOpenAIStream(`${invalidLine}\ndata: [DONE]`);
    await anthropicAIStream(invalidLine);
    parseVercelStream(invalidLine);

    expect(JSON.stringify(log.mock.calls)).not.toContain(
      "customer-secret-marker"
    );
  });
});
