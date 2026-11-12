import {
  azureConfiguredOrigins,
  hasFirstPartyEntry,
  isFirstPartyTargetForProvider,
  normalizeVaultProviderName,
} from "../../cost/providers/firstPartyOrigins";
import { providers } from "../../cost/models/providers";

describe("isFirstPartyTargetForProvider", () => {
  it("has a first-party entry for every AI Gateway provider", () => {
    for (const name of Object.keys(providers)) {
      expect(hasFirstPartyEntry(name)).toBe(true);
    }
  });

  it("accepts every AI Gateway provider's default base URL", () => {
    for (const [name, provider] of Object.entries(providers)) {
      const base = provider.baseUrl
        .replace("{region}", "us-east-1")
        .replace("{resourceName}", "myres");
      const config =
        name === "azure" ? { baseUri: "https://myres.openai.azure.com" } : null;
      expect(isFirstPartyTargetForProvider(name, config, base)).toBe(true);
    }
  });

  it("normalizes legacy provider names", () => {
    expect(normalizeVaultProviderName("OpenAI")).toBe("openai");
    expect(normalizeVaultProviderName("GOOGLE")).toBe("google-ai-studio");
    expect(normalizeVaultProviderName("AWS")).toBe("bedrock");
    expect(normalizeVaultProviderName(null)).toBe("");
  });

  it("never allows tenant-controllable hosts, whatever the provider", () => {
    const targets = [
      "https://evil.openai.azure.com",
      "https://evil.azure-api.net",
      "https://gateway.ai.cloudflare.com/v1/a/b/openai",
      "https://qstash.upstash.io/llm",
      "http://api.openai.com",
    ];
    for (const name of ["openai", "portal", "custom", "", "azure"]) {
      for (const target of targets) {
        expect(isFirstPartyTargetForProvider(name, null, target)).toBe(false);
      }
    }
  });

  it("derives Azure origins only from https config values", () => {
    expect(
      azureConfiguredOrigins({
        baseUri: "https://a.openai.azure.com/",
        resourceName: "b",
      }),
    ).toEqual(["https://a.openai.azure.com", "https://b.openai.azure.com"]);
    expect(
      azureConfiguredOrigins({ baseUri: "http://a.openai.azure.com" }),
    ).toEqual([]);
    expect(azureConfiguredOrigins({ resourceName: "evil.com/x" })).toEqual([]);
  });
});
