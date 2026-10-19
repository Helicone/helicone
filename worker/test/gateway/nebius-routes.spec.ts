import { describe, expect, it } from "vitest";
import { buildTargetUrl } from "../../src/lib/clients/ProviderClient";

describe("Nebius Token Factory legacy gateway routes", () => {
  const tokenFactoryBaseUrl = "https://api.tokenfactory.nebius.com";

  it.each(["/v1/chat/completions", "/v1/images/generations"])(
    "preserves the %s route",
    (pathname) => {
      const gatewayUrl = new URL(`https://nebius.helicone.ai${pathname}`);

      expect(buildTargetUrl(gatewayUrl, tokenFactoryBaseUrl).href).toBe(
        `${tokenFactoryBaseUrl}${pathname}`
      );
    }
  );

  it("preserves query parameters", () => {
    const gatewayUrl = new URL(
      "https://nebius.helicone.ai/v1/chat/completions?region=eu-north1"
    );

    expect(buildTargetUrl(gatewayUrl, tokenFactoryBaseUrl).href).toBe(
      `${tokenFactoryBaseUrl}/v1/chat/completions?region=eu-north1`
    );
  });
});
