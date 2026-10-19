import { env } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  azureConfiguredOrigins,
  isFirstPartyTargetForProvider,
} from "@helicone-package/cost/providers/firstPartyOrigins";
import { isApprovedApiBase } from "@helicone-package/cost/providers/mappings";
import {
  CredentialPin,
  isTargetAllowedForPin,
} from "../../src/lib/security/credentialPin";
import { callProvider, CallProps } from "../../src/lib/clients/ProviderClient";

function callProps(overrides: Partial<CallProps>): CallProps {
  return {
    headers: new Headers({
      "content-type": "application/json",
      authorization: "Bearer sk-decrypted-vault-key",
    }),
    method: "POST",
    apiBase: "https://api.openai.com",
    body: JSON.stringify({ model: "gpt-4o-mini" }),
    increaseTimeout: false,
    originalUrl: new URL("https://oai.helicone.ai/v1/chat/completions"),
    extraHeaders: null,
    env: { ...env, ENVIRONMENT: "production" } as Env,
    credentialPin: null,
    ...overrides,
  };
}

describe("first-party target pinning for stored provider keys", () => {
  it("allows each provider's own first-party origin", () => {
    expect(
      isFirstPartyTargetForProvider("openai", null, "https://api.openai.com/v1")
    ).toBe(true);
    expect(
      isFirstPartyTargetForProvider("OpenAI", null, "https://us.api.openai.com")
    ).toBe(true);
    expect(
      isFirstPartyTargetForProvider(
        "anthropic",
        null,
        "https://api.anthropic.com/v1/messages"
      )
    ).toBe(true);
    expect(
      isFirstPartyTargetForProvider(
        "google-ai-studio",
        null,
        "https://generativelanguage.googleapis.com/v1beta/models/x:generateContent"
      )
    ).toBe(true);
    expect(
      isFirstPartyTargetForProvider(
        "vertex",
        null,
        "https://us-central1-aiplatform.googleapis.com/v1/projects/p"
      )
    ).toBe(true);
    expect(
      isFirstPartyTargetForProvider(
        "bedrock",
        null,
        "https://bedrock-runtime.us-east-1.amazonaws.com/model/x/invoke"
      )
    ).toBe(true);
  });

  it("rejects another provider's host for a provider-specific key", () => {
    expect(
      isFirstPartyTargetForProvider("openai", null, "https://api.anthropic.com")
    ).toBe(false);
    expect(
      isFirstPartyTargetForProvider("anthropic", null, "https://api.groq.com")
    ).toBe(false);
  });

  it("rejects multi-tenant and attacker-controllable hosts", () => {
    for (const target of [
      "https://attacker.openai.azure.com/openai",
      "https://attacker.azure-api.net/",
      "https://attacker.cognitiveservices.azure.com/",
      "https://attacker.services.ai.azure.com/",
      "https://gateway.ai.cloudflare.com/v1/acct/gw/openai",
      "https://qstash.upstash.io/llm",
      "https://evil.amdbartek.dev/",
      "https://gateway.llmmapper.com/",
    ]) {
      // even for keys with no first-party entry (legacy "portal" keys)
      expect(isFirstPartyTargetForProvider("portal", null, target)).toBe(false);
      expect(isFirstPartyTargetForProvider("openai", null, target)).toBe(false);
    }
  });

  it("requires https, no userinfo and no explicit port", () => {
    expect(
      isFirstPartyTargetForProvider("openai", null, "http://api.openai.com/v1")
    ).toBe(false);
    expect(
      isFirstPartyTargetForProvider(
        "openai",
        null,
        "https://api.openai.com@attacker.com/v1"
      )
    ).toBe(false);
    expect(
      isFirstPartyTargetForProvider(
        "openai",
        null,
        "https://user:pw@api.openai.com/v1"
      )
    ).toBe(false);
    expect(
      isFirstPartyTargetForProvider(
        "openai",
        null,
        "https://api.openai.com:8443"
      )
    ).toBe(false);
    expect(
      isFirstPartyTargetForProvider(
        "bedrock",
        null,
        "https://bedrock-runtime.evil.com/.amazonaws.com"
      )
    ).toBe(false);
  });

  it("pins Azure keys to the endpoint stored in the key config only", () => {
    const config = { baseUri: "https://my-resource.openai.azure.com/" };
    expect(azureConfiguredOrigins(config)).toEqual([
      "https://my-resource.openai.azure.com",
    ]);
    expect(
      isFirstPartyTargetForProvider(
        "azure",
        config,
        "https://my-resource.openai.azure.com/openai/deployments/x"
      )
    ).toBe(true);
    expect(
      isFirstPartyTargetForProvider(
        "azure",
        config,
        "https://other-resource.openai.azure.com/openai"
      )
    ).toBe(false);
    // no config -> nothing is allowed
    expect(
      isFirstPartyTargetForProvider(
        "azure",
        null,
        "https://my-resource.openai.azure.com/openai"
      )
    ).toBe(false);
    // http endpoints in config are ignored
    expect(
      azureConfiguredOrigins({ baseUri: "http://my-resource.openai.azure.com" })
    ).toEqual([]);
  });

  it("isTargetAllowedForPin applies the pin's provider and config", () => {
    const pin: CredentialPin = {
      source: "proxy",
      providerName: "openai",
      config: null,
    };
    expect(isTargetAllowedForPin(pin, "https://api.openai.com/v1/x")).toBe(
      true
    );
    expect(isTargetAllowedForPin(pin, "https://myres.openai.azure.com")).toBe(
      false
    );
  });

  it("approved api bases now require https (except the local dev proxy)", () => {
    expect(isApprovedApiBase("http://myres.openai.azure.com/openai")).toBe(
      false
    );
    expect(isApprovedApiBase("https://myres.openai.azure.com/openai")).toBe(
      true
    );
    expect(isApprovedApiBase("http://127.0.0.1:8080/v1")).toBe(true);
  });
});

describe("callProvider enforces the credential pin before fetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("refuses to send a vault key to a non-first-party origin", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("should not be called"));

    const response = await callProvider(
      callProps({
        apiBase: "https://attacker.openai.azure.com",
        credentialPin: {
          source: "proxy",
          providerName: "openai",
          config: null,
        },
      })
    );

    expect(response.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuses a BYOK azure key whose target differs from its config", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("should not be called"));

    const response = await callProvider(
      callProps({
        apiBase: "https://attacker.openai.azure.com",
        credentialPin: {
          source: "byok",
          providerName: "azure",
          config: { baseUri: "https://victim.openai.azure.com" },
        },
      })
    );

    expect(response.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("forwards a vault key to its first-party origin without following redirects", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    const response = await callProvider(
      callProps({
        apiBase: "https://api.openai.com",
        credentialPin: {
          source: "proxy",
          providerName: "openai",
          config: null,
        },
      })
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect((init as RequestInit).redirect).toBe("manual");
  });

  it("does not pin requests that carry the caller's own provider key", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    const response = await callProvider(
      callProps({
        apiBase: "https://my-resource.openai.azure.com",
        credentialPin: null,
      })
    );

    expect(response.status).toBe(200);
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "https://my-resource.openai.azure.com/v1/chat/completions"
    );
  });

  it("ignores __helicone-mock-response outside development", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response('{"real":true}', { status: 200 }));

    const response = await callProvider(
      callProps({
        headers: new Headers({
          "content-type": "application/json",
          "__helicone-mock-response": JSON.stringify({ mocked: true }),
        }),
      })
    );

    expect(await response.json()).toEqual({ real: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const sent = (fetchSpy.mock.calls[0][1] as RequestInit).headers as Headers;
    expect(sent.has("__helicone-mock-response")).toBe(false);
  });
});
