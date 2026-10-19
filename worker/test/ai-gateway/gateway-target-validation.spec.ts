import { beforeEach, describe, expect, it, vi } from "vitest";

// Stub the downstream forwarder so these tests exercise only getProvider's
// target validation (CIRT-76). The rest of the ai-gateway suite mocks
// gatewayForwarder wholesale, so nothing else covers this path.
vi.mock("../../src/lib/HeliconeProxyRequest/ProxyForwarder", () => ({
  proxyForwarder: vi.fn(
    async (_rw: unknown, _env: unknown, _ctx: unknown, provider: string) =>
      new Response(provider, { status: 200 })
  ),
}));

import { gatewayForwarder } from "../../src/routers/gatewayRouter";
import { proxyForwarder } from "../../src/lib/HeliconeProxyRequest/ProxyForwarder";

async function forward(
  targetBaseUrl: string | null,
  headers: Record<string, string> = {}
) {
  const setBaseURLOverride = vi.fn();
  const response = await gatewayForwarder(
    { targetBaseUrl, setBaseURLOverride },
    { headers: new Headers(headers) } as any,
    {} as Env,
    {} as ExecutionContext
  );
  return { response, setBaseURLOverride };
}

describe("gatewayForwarder target validation", () => {
  beforeEach(() => {
    vi.mocked(proxyForwarder).mockClear();
  });

  it("forwards approved origins", async () => {
    const { response, setBaseURLOverride } = await forward(
      "https://api.together.xyz"
    );
    expect(response.status).toBe(200);
    expect(setBaseURLOverride).toHaveBeenCalledWith("https://api.together.xyz");
  });

  it("forwards approved full endpoint URLs (AI Gateway, firecrawl, bedrock)", async () => {
    for (const url of [
      "https://api.anthropic.com/v1/messages",
      "https://api.firecrawl.dev/v0/scrape",
      "https://bedrock-runtime.us-east-1.amazonaws.com/model/x/converse",
      "https://inference.baseten.co/v1/chat/completions",
    ]) {
      const { response, setBaseURLOverride } = await forward(url);
      expect(response.status).toBe(200);
      expect(setBaseURLOverride).toHaveBeenCalledWith(url);
    }
  });

  it("rejects unapproved hosts with 403 and never sets the override", async () => {
    for (const url of [
      "https://attacker.example",
      "https://attacker.example/v1/messages",
      "https://api.anthropic.com@attacker.example",
      "https://api.anthropic.com.attacker.example",
    ]) {
      const { response, setBaseURLOverride } = await forward(url);
      expect(response.status).toBe(403);
      expect(setBaseURLOverride).not.toHaveBeenCalled();
    }
    expect(proxyForwarder).not.toHaveBeenCalled();
  });

  it("rejects missing or unparseable targets with 400", async () => {
    for (const url of [null, "not a url"]) {
      const { response, setBaseURLOverride } = await forward(url);
      expect(response.status).toBe(400);
      expect(setBaseURLOverride).not.toHaveBeenCalled();
    }
    expect(proxyForwarder).not.toHaveBeenCalled();
  });

  it("validates the Upstash-Callback origin", async () => {
    const unapproved = await forward("https://qstash.upstash.io", {
      "Upstash-Callback": "https://attacker.example/cb",
    });
    expect(unapproved.response.status).toBe(403);

    const malformed = await forward("https://qstash.upstash.io", {
      "Upstash-Callback": "not a url",
    });
    expect(malformed.response.status).toBe(400);

    const noCallback = await forward("https://qstash.upstash.io");
    expect(noCallback.response.status).toBe(200);
    expect(await noCallback.response.text()).toBe("QSTASH");
  });
});
