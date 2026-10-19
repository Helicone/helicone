import { describe, expect, it } from "vitest";
import { redactSecretsFromUrl } from "../../src/lib/security/redact";
import { GoogleProvider } from "@helicone-package/cost/models/providers/google";
import type { Endpoint } from "@helicone-package/cost/models/types";

describe("redactSecretsFromUrl", () => {
  it("redacts Google ?key= while keeping the rest of the URL", () => {
    const redacted = redactSecretsFromUrl(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=AIzaSySECRET"
    );
    expect(redacted).not.toContain("AIzaSySECRET");
    expect(redacted).toContain(
      "/v1beta/models/gemini-2.5-flash:streamGenerateContent"
    );
    expect(redacted).toContain("alt=sse");
    expect(redacted).toContain("key=REDACTED");
  });

  it("redacts other api-key-like query params", () => {
    const redacted = redactSecretsFromUrl(
      "https://x.example.com/p?api_key=a1&apikey=a2&access_token=a3&sig=a4&X-Amz-Signature=a5&model=gpt"
    );
    for (const secret of ["a1", "a2", "a3", "a4", "a5"]) {
      expect(redacted).not.toMatch(new RegExp(`=${secret}(&|$)`));
    }
    expect(redacted).toContain("model=gpt");
  });

  it("redacts Helicone keys in path segments and query values", () => {
    const redacted = redactSecretsFromUrl(
      "https://oai.helicone.ai/sk-helicone-abcdefg-hijklmn-opqrstu-vwxyz12/v1/chat?x=sk-helicone-abcdefg-hijklmn-opqrstu-vwxyz12"
    );
    expect(redacted).not.toContain("sk-helicone-abcdefg");
    expect(redacted).toContain("/v1/chat");
  });

  it("strips userinfo", () => {
    expect(
      redactSecretsFromUrl("https://user:pass@api.openai.com/v1")
    ).not.toContain("pass");
  });

  it("leaves URLs without secrets byte-for-byte unchanged", () => {
    const url = "https://api.openai.com/v1/chat/completions?stream=true";
    expect(redactSecretsFromUrl(url)).toBe(url);
  });

  it("masks key= even in unparseable input", () => {
    expect(redactSecretsFromUrl("not a url?key=SECRET")).toBe(
      "not a url?key=REDACTED"
    );
  });
});

describe("Google AI Studio authentication", () => {
  const provider = new GoogleProvider();
  const endpoint = {
    providerModelId: "gemini-2.5-flash",
    userConfig: {},
  } as unknown as Endpoint;

  it("never puts the API key in the URL", () => {
    const nonStreaming = provider.buildUrl(endpoint, {
      apiKey: "AIzaSySECRET",
      isStreaming: false,
    } as never);
    const streaming = provider.buildUrl(endpoint, {
      apiKey: "AIzaSySECRET",
      isStreaming: true,
    } as never);

    expect(nonStreaming).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    );
    expect(streaming).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse"
    );
    expect(nonStreaming).not.toContain("SECRET");
    expect(streaming).not.toContain("SECRET");
  });

  it("sends the API key in the x-goog-api-key header", () => {
    const auth = provider.authenticate(
      { apiKey: "AIzaSySECRET" } as never,
      endpoint
    );
    expect(auth).toEqual({ headers: { "x-goog-api-key": "AIzaSySECRET" } });
  });
});
