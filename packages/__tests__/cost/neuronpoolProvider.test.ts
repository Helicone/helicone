import { describe, it, expect } from "@jest/globals";
import { providers } from "../../cost/models/providers";
import { PROVIDER_PRIORITIES } from "../../cost/models/providers/priorities";
import { getUsageProcessor } from "../../cost/usage/getUsageProcessor";
import { endpoints as tinyChatEndpoints } from "../../cost/models/authors/neuronpool/tiny-chat/endpoints";
import { endpoints as gptOssEndpoints } from "../../cost/models/authors/openai/oss/endpoints";
import { endpoints as llamaEndpoints } from "../../cost/models/authors/meta/llama/endpoints";
import { endpoints as qwen25Endpoints } from "../../cost/models/authors/alibaba/qwen2.5/endpoints";
import { endpoints as qwen3Endpoints } from "../../cost/models/authors/alibaba/qwen3/endpoints";
import { endpoints as gemmaEndpoints } from "../../cost/models/authors/google/gemma-3/endpoints";
import { endpoints as nomicEndpoints } from "../../cost/models/authors/nomic/nomic-embed-text/endpoints";

const NEURONPOOL_ENDPOINTS = {
  ...Object.fromEntries(
    Object.entries(tinyChatEndpoints).filter(([key]) => key.endsWith(":neuronpool")),
  ),
  ...Object.fromEntries(
    Object.entries(gptOssEndpoints).filter(([key]) => key.endsWith(":neuronpool")),
  ),
  ...Object.fromEntries(
    Object.entries(llamaEndpoints).filter(([key]) => key.endsWith(":neuronpool")),
  ),
  ...Object.fromEntries(
    Object.entries(qwen25Endpoints).filter(([key]) => key.endsWith(":neuronpool")),
  ),
  ...Object.fromEntries(
    Object.entries(qwen3Endpoints).filter(([key]) => key.endsWith(":neuronpool")),
  ),
  ...Object.fromEntries(
    Object.entries(gemmaEndpoints).filter(([key]) => key.endsWith(":neuronpool")),
  ),
  ...Object.fromEntries(
    Object.entries(nomicEndpoints).filter(([key]) => key.endsWith(":neuronpool")),
  ),
};

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

  it("lists the catalog endpoints and keeps pass-through billing off", () => {
    expect(Object.keys(NEURONPOOL_ENDPOINTS).sort()).toEqual([
      "gemma-3-12b-it:neuronpool",
      "gpt-oss-20b:neuronpool",
      "llama-3.1-8b-instruct:neuronpool",
      "llama-3.2-1b-instruct:neuronpool",
      "neuronpool-tiny-chat:neuronpool",
      "nomic-embed-text:neuronpool",
      "qwen2.5-7b-instruct:neuronpool",
      "qwen3-30b-a3b:neuronpool",
    ]);
    for (const [key, endpoint] of Object.entries(NEURONPOOL_ENDPOINTS)) {
      expect({ key, ptbEnabled: endpoint.ptbEnabled }).toEqual({
        key,
        ptbEnabled: false,
      });
      expect(endpoint.provider).toBe("neuronpool");
      expect(endpoint.pricing?.[0]?.input).toBeGreaterThan(0);
    }
  });
});
