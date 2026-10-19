// Run with: npx tsx --test lib/api/security/__tests__/*.test.ts lib/slack/__tests__/*.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { NextApiRequest } from "next";
import { isSameOriginRequest } from "../sameOrigin";
import { maskProviderSecret } from "../maskProviderSecret";

function req(
  method: string,
  headers: Record<string, string | undefined>,
): NextApiRequest {
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (v !== undefined) clean[k] = v;
  }
  return { method, headers: clean } as unknown as NextApiRequest;
}

describe("isSameOriginRequest", () => {
  const host = "us.helicone.ai";

  it("allows safe methods without any headers", () => {
    assert.equal(isSameOriginRequest(req("GET", { host })), true);
  });

  it("allows same-origin mutations", () => {
    assert.equal(
      isSameOriginRequest(
        req("DELETE", {
          host,
          origin: "https://us.helicone.ai",
          "sec-fetch-site": "same-origin",
        }),
      ),
      true,
    );
  });

  it("rejects cross-site mutations by Origin", () => {
    assert.equal(
      isSameOriginRequest(
        req("POST", { host, origin: "https://evil.example" }),
      ),
      false,
    );
  });

  it("rejects same-site (sibling subdomain) mutations", () => {
    assert.equal(
      isSameOriginRequest(
        req("POST", {
          host,
          origin: "https://eu.helicone.ai",
          "sec-fetch-site": "same-site",
        }),
      ),
      false,
    );
  });

  it("rejects when Sec-Fetch-Site is cross-site even if Origin matches", () => {
    assert.equal(
      isSameOriginRequest(
        req("POST", {
          host,
          origin: "https://us.helicone.ai",
          "sec-fetch-site": "cross-site",
        }),
      ),
      false,
    );
  });

  it("rejects opaque (null) origins", () => {
    assert.equal(
      isSameOriginRequest(req("POST", { host, origin: "null" })),
      false,
    );
  });

  it("falls back to Referer", () => {
    assert.equal(
      isSameOriginRequest(
        req("POST", { host, referer: "https://us.helicone.ai/vault" }),
      ),
      true,
    );
    assert.equal(
      isSameOriginRequest(
        req("POST", { host, referer: "https://evil.example/x" }),
      ),
      false,
    );
  });

  it("rejects mutations with no provenance headers", () => {
    assert.equal(isSameOriginRequest(req("POST", { host })), false);
  });
});

describe("maskProviderSecret", () => {
  it("matches Jawn's format for long keys", () => {
    assert.equal(
      maskProviderSecret("sk-ant-api03-abcdefghijklmnopqrstuvwxyz-WXYZ"),
      "sk-ant••••••••WXYZ",
    );
  });

  it("keeps only the last 4 for medium values", () => {
    assert.equal(maskProviderSecret("abcdefghijkl"), "••••••••ijkl");
  });

  it("fully masks short values and handles empty", () => {
    assert.equal(maskProviderSecret("short"), "••••••••");
    assert.equal(maskProviderSecret(""), null);
    assert.equal(maskProviderSecret(null), null);
  });
});
