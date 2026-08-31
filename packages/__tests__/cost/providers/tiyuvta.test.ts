import { describe, expect, it } from "@jest/globals";
import { OpenAIUsageProcessor } from "../../../cost/usage/openAIUsageProcessor";
import { getUsageProcessor } from "../../../cost/usage/getUsageProcessor";
import {
  authenticateRequest,
  dbProviderToProvider,
  getProvider,
  heliconeProviderToModelProviderName,
} from "../../../cost/models/provider-helpers";
import { registry } from "../../../cost/models/registry";
import { providers as detectedProviders } from "../../../cost/providers/mappings";

describe("Tiyuvta provider", () => {
  it("maps provider names and the public API origin", () => {
    expect(heliconeProviderToModelProviderName("TIYUVTA")).toBe("tiyuvta");
    expect(dbProviderToProvider("Tiyuvta")).toBe("tiyuvta");
    expect(
      detectedProviders
        .find(({ provider }) => provider === "TIYUVTA")
        ?.pattern.test("https://api.tiyuvta.ai/v1/chat/completions"),
    ).toBe(true);
  });

  it("builds the OpenAI-compatible endpoint with bearer authentication", async () => {
    const provider = getProvider("tiyuvta");
    expect(provider.error).toBeNull();

    const config = registry.getModelProviderConfig("qwen3.8-27b", "tiyuvta");
    expect(config.error).toBeNull();

    const endpoint = registry.buildEndpoint(config.data!, {});
    expect(endpoint.error).toBeNull();
    expect(provider.data!.buildUrl(endpoint.data!, {})).toBe(
      "https://api.tiyuvta.ai/v1/chat/completions",
    );

    const auth = await authenticateRequest(endpoint.data!, {
      apiKey: "test-tiyuvta-key",
    });
    expect(auth.data?.headers.Authorization).toBe("Bearer test-tiyuvta-key");
  });

  it("records exact cached-input pricing for both models", () => {
    const qwen = registry.getModelProviderConfig("qwen3.8-27b", "tiyuvta");
    const ornith = registry.getModelProviderConfig(
      "ornith-1.5-35b-a3b",
      "tiyuvta",
    );

    expect(qwen.data?.pricing[0]?.input).toBe(0.0000003);
    expect(
      (qwen.data?.pricing[0]?.input ?? 0) *
        (qwen.data?.pricing[0]?.cacheMultipliers?.cachedInput ?? 0),
    ).toBeCloseTo(0.0000001);
    expect(ornith.data?.pricing[0]?.input).toBe(0.00000025);
    expect(
      (ornith.data?.pricing[0]?.input ?? 0) *
        (ornith.data?.pricing[0]?.cacheMultipliers?.cachedInput ?? 0),
    ).toBeCloseTo(0.00000009);
  });

  it("uses the OpenAI usage parser", () => {
    expect(getUsageProcessor("tiyuvta")).toBeInstanceOf(OpenAIUsageProcessor);
  });
});
