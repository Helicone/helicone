import { describe, it, expect } from "@jest/globals";
import { providers } from "../../cost/models/providers";
import { PROVIDER_PRIORITIES } from "../../cost/models/providers/priorities";
import { getUsageProcessor } from "../../cost/usage/getUsageProcessor";
import { endpoints as tinyChatEndpoints } from "../../cost/models/authors/neuronpool/tiny-chat/endpoints";
import { endpoints as gptOssEndpoints } from "../../cost/models/authors/openai/oss/endpoints";

describe("NeuronPool provider", () => {
  it("registers an api-key provider pointed at the live worker", () => {
    const provider = providers.neuronpool;
    expect(provider.displayName).toBe("NeuronPool");
    expect(provider.auth).toBe("api-key");
    expect(provider.baseUrl).toBe("https://neuronpool.damnknee.workers.dev/");
    expect(
      provider.buildUrl(
        { providerModelId: "gpt-oss-20b" } as never,
        {} as never,
      ),
    ).toBe("https://neuronpool.damnknee.workers.dev/v1/chat/completions");
  });

  it("is priority 4 and uses the OpenAI usage processor", () => {
    expect(PROVIDER_PRIORITIES.neuronpool).toBe(4);
    expect(getUsageProcessor("neuronpool")).toBeTruthy();
  });

  it("keeps pass-through billing off on catalog endpoints", () => {
    expect(tinyChatEndpoints["neuronpool-tiny-chat:neuronpool"]?.ptbEnabled).toBe(
      false,
    );
    expect(gptOssEndpoints["gpt-oss-20b:neuronpool"]?.ptbEnabled).toBe(false);
  });
});
