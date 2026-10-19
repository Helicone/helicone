import { env } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildProviderRequestHeaders,
  containsHeliconeKey,
} from "../../src/lib/security/outboundHeaders";
import { callProvider } from "../../src/lib/clients/ProviderClient";

const HELICONE_KEY = "sk-helicone-abcdefg-hijklmn-opqrstu-vwxyz12";

describe("containsHeliconeKey", () => {
  it("detects Helicone API, proxy and portal keys in any position", () => {
    expect(containsHeliconeKey(`Bearer ${HELICONE_KEY}`)).toBe(true);
    expect(containsHeliconeKey(HELICONE_KEY)).toBe(true);
    expect(
      containsHeliconeKey(
        "Bearer sk-helicone-proxy-abcdefg-1234567-0f0f0f0f-0f0f-0f0f-0f0f-0f0f0f0f0f0f"
      )
    ).toBe(true);
    expect(
      containsHeliconeKey(
        "Bearer sk-helicone-cp-abcdefg-hijklmn-opqrstu-vwxyz12"
      )
    ).toBe(true);
    expect(
      containsHeliconeKey(`Bearer sk-openai-123, Bearer ${HELICONE_KEY}`)
    ).toBe(true);
    // legacy 4x7 format
    expect(
      containsHeliconeKey("Bearer sk-abcdefg-hijklmn-opqrstu-vwxyz12")
    ).toBe(true);
  });

  it("does not flag provider keys", () => {
    expect(containsHeliconeKey("Bearer sk-proj-abc123DEF456")).toBe(false);
    expect(containsHeliconeKey("sk-ant-api03-xyz")).toBe(false);
    expect(containsHeliconeKey("Bearer sk-or-v1-0123456789abcdef")).toBe(false);
    expect(containsHeliconeKey(null)).toBe(false);
  });
});

describe("buildProviderRequestHeaders", () => {
  it("keeps provider headers and drops Helicone and edge headers", () => {
    const inbound = new Headers({
      "content-type": "application/json",
      accept: "text/event-stream",
      authorization: "Bearer sk-proj-provider-key",
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "prompt-caching-2024-07-31",
      "openai-organization": "org-123",
      "x-stainless-lang": "js",
      "x-goog-api-key": "AIza-provider",
      "api-key": "azure-key",
      "x-amz-date": "20250101T000000Z",
      "http-referer": "https://example.com",
      "x-title": "My App",
      "helicone-auth": `Bearer ${HELICONE_KEY}`,
      "helicone-organization-id": "org-uuid",
      "helicone-request-id": "req-uuid",
      "helicone-property-foo": "bar",
      "__helicone-mock-response": "{}",
      cookie: "session=abc",
      "x-forwarded-for": "1.2.3.4",
      "cf-connecting-ip": "1.2.3.4",
      "x-real-ip": "1.2.3.4",
    });

    const out = buildProviderRequestHeaders(inbound);
    const names = Array.from(out.keys());

    for (const kept of [
      "content-type",
      "accept",
      "authorization",
      "anthropic-version",
      "anthropic-beta",
      "openai-organization",
      "x-stainless-lang",
      "x-goog-api-key",
      "api-key",
      "x-amz-date",
      "http-referer",
      "x-title",
    ]) {
      expect(names).toContain(kept);
    }
    for (const dropped of [
      "helicone-auth",
      "helicone-organization-id",
      "helicone-request-id",
      "helicone-property-foo",
      "__helicone-mock-response",
      "cookie",
      "x-forwarded-for",
      "cf-connecting-ip",
      "x-real-ip",
    ]) {
      expect(names).not.toContain(dropped);
    }
  });

  it("drops any allowlisted header whose value is a Helicone key", () => {
    const out = buildProviderRequestHeaders(
      new Headers({
        authorization: `Bearer ${HELICONE_KEY}`,
        "x-api-key": HELICONE_KEY,
        "content-type": "application/json",
      })
    );
    expect(out.has("authorization")).toBe(false);
    expect(out.has("x-api-key")).toBe(false);
    expect(out.get("content-type")).toBe("application/json");
  });

  it("filters extra headers too (helicone-organization-id never reaches providers)", () => {
    const out = buildProviderRequestHeaders(
      new Headers({ authorization: "Bearer sk-proj-provider" }),
      new Headers({
        "helicone-organization-id": "org-uuid",
        "helicone-request-id": "req-uuid",
      })
    );
    expect(Array.from(out.keys())).toEqual(["authorization"]);
  });
});

describe("callProvider sends only allowlisted headers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("strips Helicone credentials and control headers from the provider request", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    await callProvider({
      headers: new Headers({
        "content-type": "application/json",
        "x-api-key": "sk-ant-provider",
        authorization: `Bearer ${HELICONE_KEY}`,
        "helicone-auth": `Bearer ${HELICONE_KEY}`,
        "helicone-target-url": "https://api.anthropic.com",
        cookie: "a=b",
      }),
      method: "POST",
      apiBase: "https://api.anthropic.com",
      body: "{}",
      increaseTimeout: false,
      originalUrl: new URL("https://anthropic.helicone.ai/v1/messages"),
      extraHeaders: new Headers({ "helicone-organization-id": "org-uuid" }),
      env: { ...env, ENVIRONMENT: "production" } as Env,
      credentialPin: null,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const sent = (fetchSpy.mock.calls[0][1] as RequestInit).headers as Headers;
    expect(Object.fromEntries(sent.entries())).toEqual({
      "content-type": "application/json",
      "x-api-key": "sk-ant-provider",
    });
  });
});
