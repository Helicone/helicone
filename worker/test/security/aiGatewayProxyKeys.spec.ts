import { env, createExecutionContext } from "cloudflare:test";
import { Router } from "itty-router";
import { describe, expect, it, vi } from "vitest";
import { getAIGatewayRouter } from "../../src/routers/aiGatewayRouter";
import { RequestWrapper } from "../../src/lib/RequestWrapper";
import { CredentialPin } from "../../src/lib/security/credentialPin";

function fakeWrapper(overrides: Partial<Record<string, unknown>>) {
  return {
    setRequestReferrer: vi.fn(),
    isVaultKeyRequest: () => false,
    getUrl: () => "https://ai-gateway.helicone.ai/v1/chat/completions",
    getMethod: () => "POST",
    headers: new Headers(),
    ...overrides,
  } as unknown as RequestWrapper;
}

describe("AI Gateway rejects stored-key credentials", () => {
  it("returns 401 for proxy / customer-portal keys before touching org BYOK keys", async () => {
    const router = getAIGatewayRouter(Router() as never);
    const auth = vi.fn();
    const wrapper = fakeWrapper({
      isVaultKeyRequest: () => true,
      auth,
      getRawProviderAuthHeader: vi.fn(),
      getProviderAuthHeader: vi.fn(),
    });

    const response: Response = await router.handle(
      new Request("https://ai-gateway.helicone.ai/v1/chat/completions", {
        method: "POST",
        body: "{}",
      }),
      wrapper,
      env,
      createExecutionContext()
    );

    expect(response.status).toBe(401);
    const body = (await response.json()) as { error: { type: string } };
    expect(body.error.type).toBe("invalid_api_key");
    expect(auth).not.toHaveBeenCalled();
  });
});

describe("RequestWrapper.getCredentialPin", () => {
  function bareWrapper(fields: Record<string, unknown>): RequestWrapper {
    const wrapper = Object.create(RequestWrapper.prototype) as RequestWrapper;
    Object.assign(
      wrapper,
      { vaultKeyPin: null, gatewayAttempt: undefined },
      fields
    );
    return wrapper;
  }

  it("pins AI Gateway BYOK attempts to the key's provider and config", () => {
    const wrapper = bareWrapper({
      gatewayAttempt: {
        authType: "byok",
        endpoint: { provider: "azure" },
        providerKey: {
          provider: "azure",
          config: { baseUri: "https://victim.openai.azure.com" },
        },
      },
    });
    expect(wrapper.getCredentialPin()).toEqual({
      source: "byok",
      providerName: "azure",
      config: { baseUri: "https://victim.openai.azure.com" },
    });
  });

  it("does not pin PTB attempts (Helicone's own keys, registry-fixed URLs)", () => {
    const wrapper = bareWrapper({
      gatewayAttempt: {
        authType: "ptb",
        endpoint: { provider: "openai" },
        providerKey: { provider: "openai", config: null },
      },
    });
    expect(wrapper.getCredentialPin()).toBeNull();
  });

  it("prefers the vault pin when the key came from the vault", () => {
    const pin: CredentialPin = {
      source: "proxy",
      providerName: "openai",
      config: null,
    };
    const wrapper = bareWrapper({ vaultKeyPin: pin });
    expect(wrapper.isVaultKeyRequest()).toBe(true);
    expect(wrapper.getCredentialPin()).toBe(pin);
  });
});
