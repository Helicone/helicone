import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import { Response } from "node-fetch";

// Mock ProxyForwarder so we can assert on the provider/wrapper passed to it
// without spinning up Kafka/S3/ClickHouse from the test process.
//
// `mock`-prefixed names are the only references jest allows inside a
// `jest.mock` factory after hoisting (everything else is in TDZ).
jest.mock("../../../lib/proxy/ProxyForwarder", () => ({
  proxyForwarder: jest.fn(),
}));

// WebSocketProxyForwarder pulls in heavy deps (durable objects, etc.) that
// aren't needed for these unit tests — stub it.
jest.mock("../../../lib/proxy/WebSocketProxyForwarder", () => ({
  webSocketProxyForwarder: jest.fn(),
}));

import { RequestWrapper } from "../../../lib/requestWrapper/requestWrapper";
import { proxyForwarder } from "../../../lib/proxy/ProxyForwarder";
import {
  getProviderFromTargetUrl,
  handlePassthroughProxy,
} from "../proxyController";

const mockProxyForwarder = proxyForwarder as jest.MockedFunction<
  typeof proxyForwarder
>;

function makeRequestWrapper(targetBaseUrl: string | null): RequestWrapper {
  let baseURLOverride: string | null = null;
  return {
    heliconeHeaders: { targetBaseUrl } as RequestWrapper["heliconeHeaders"],
    setBaseURLOverride(url: string) {
      baseURLOverride = url;
    },
    get baseURLOverride() {
      return baseURLOverride;
    },
  } as unknown as RequestWrapper;
}

beforeEach(() => {
  mockProxyForwarder.mockReset();
});

describe("getProviderFromTargetUrl", () => {
  test("matches OpenRouter origin", () => {
    expect(getProviderFromTargetUrl("https://openrouter.ai")).toBe(
      "OPENROUTER"
    );
  });

  test("matches OpenAI origin", () => {
    expect(getProviderFromTargetUrl("https://api.openai.com")).toBe("OPENAI");
  });

  test("matches Anthropic origin", () => {
    expect(getProviderFromTargetUrl("https://api.anthropic.com")).toBe(
      "ANTHROPIC"
    );
  });

  test("falls back to CUSTOM for unknown origin", () => {
    expect(getProviderFromTargetUrl("https://example.invalid")).toBe("CUSTOM");
  });

  test("is case-insensitive", () => {
    expect(getProviderFromTargetUrl("https://API.OPENAI.com")).toBe("OPENAI");
  });
});

describe("handlePassthroughProxy", () => {
  test("returns 400 when Helicone-Target-URL is missing", async () => {
    const rw = makeRequestWrapper(null);
    const res = await handlePassthroughProxy(rw);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { message: string };
    expect(body.message).toContain("Helicone-Target-URL");
    expect(mockProxyForwarder).not.toHaveBeenCalled();
  });

  test("returns 400 when target URL is malformed", async () => {
    const rw = makeRequestWrapper("not a url");
    const res = await handlePassthroughProxy(rw);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { message: string };
    expect(body.message).toContain("Invalid Helicone-Target-URL");
    expect(mockProxyForwarder).not.toHaveBeenCalled();
  });

  test("returns 400 when target URL uses non-http scheme", async () => {
    const rw = makeRequestWrapper("file:///etc/passwd");
    const res = await handlePassthroughProxy(rw);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { message: string };
    expect(body.message).toContain("http(s)");
    expect(mockProxyForwarder).not.toHaveBeenCalled();
  });

  test("returns 400 when target URL contains a path", async () => {
    const rw = makeRequestWrapper("https://openrouter.ai/api/v1");
    const res = await handlePassthroughProxy(rw);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { message: string };
    expect(body.message).toContain("host-only");
    expect(mockProxyForwarder).not.toHaveBeenCalled();
  });

  test("returns 400 when target URL contains a query string", async () => {
    const rw = makeRequestWrapper("https://openrouter.ai?key=value");
    const res = await handlePassthroughProxy(rw);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { message: string };
    expect(body.message).toContain("host-only");
  });

  test("forwards a valid host-only URL to proxyForwarder with detected provider", async () => {
    const expected = new Response("ok", { status: 200 });
    mockProxyForwarder.mockResolvedValueOnce(expected);

    const rw = makeRequestWrapper("https://openrouter.ai");
    const res = await handlePassthroughProxy(rw);

    expect(res).toBe(expected);
    expect(mockProxyForwarder).toHaveBeenCalledTimes(1);
    expect(mockProxyForwarder).toHaveBeenCalledWith(rw, "OPENROUTER");
    expect(rw.baseURLOverride).toBe("https://openrouter.ai");
  });

  test("normalises trailing slash in target URL", async () => {
    const expected = new Response("ok", { status: 200 });
    mockProxyForwarder.mockResolvedValueOnce(expected);

    const rw = makeRequestWrapper("https://openrouter.ai/");
    const res = await handlePassthroughProxy(rw);

    expect(res).toBe(expected);
    expect(rw.baseURLOverride).toBe("https://openrouter.ai");
  });

  test("falls back to CUSTOM provider for unknown origins", async () => {
    const expected = new Response("ok", { status: 200 });
    mockProxyForwarder.mockResolvedValueOnce(expected);

    const rw = makeRequestWrapper("https://my-private-llm.example.com");
    await handlePassthroughProxy(rw);

    expect(mockProxyForwarder).toHaveBeenCalledWith(rw, "CUSTOM");
  });
});
