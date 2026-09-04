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
    expect(
      provider.buildUrl(
        { providerModelId: "nomic-embed-text" } as never,
        {} as never,
      ),
    ).toBe("https://neuronpool.damnknee.workers.dev/v1/embeddings");
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

  it("snapshots NeuronPool catalog pricing (official registrySnapshots is not rewritten)", () => {
    const snapshot = Object.fromEntries(
      Object.entries(NEURONPOOL_ENDPOINTS)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, endpoint]) => [
          key,
          {
            providerModelId: endpoint.providerModelId,
            ptbEnabled: endpoint.ptbEnabled,
            contextLength: endpoint.contextLength,
            pricing: endpoint.pricing,
          },
        ]),
    );
    expect(JSON.stringify(snapshot)).toBe(
      '{"gemma-3-12b-it:neuronpool":{"providerModelId":"gemma-3-12b-it","ptbEnabled":false,"contextLength":131072,"pricing":[{"threshold":0,"input":4e-8,"output":6e-8}]},"gpt-oss-20b:neuronpool":{"providerModelId":"gpt-oss-20b","ptbEnabled":false,"contextLength":131072,"pricing":[{"threshold":0,"input":1.5e-8,"output":7e-8}]},"llama-3.1-8b-instruct:neuronpool":{"providerModelId":"llama-3.1-8b-instruct","ptbEnabled":false,"contextLength":131072,"pricing":[{"threshold":0,"input":2e-8,"output":3e-8}]},"llama-3.2-1b-instruct:neuronpool":{"providerModelId":"llama-3.2-1b-instruct","ptbEnabled":false,"contextLength":131072,"pricing":[{"threshold":0,"input":5e-9,"output":1e-8}]},"neuronpool-tiny-chat:neuronpool":{"providerModelId":"neuronpool-tiny-chat","ptbEnabled":false,"contextLength":4096,"pricing":[{"threshold":0,"input":1e-9,"output":2e-9}]},"nomic-embed-text:neuronpool":{"providerModelId":"nomic-embed-text","ptbEnabled":false,"contextLength":8192,"pricing":[{"threshold":0,"input":5e-9,"output":0}]},"qwen2.5-7b-instruct:neuronpool":{"providerModelId":"qwen2.5-7b-instruct","ptbEnabled":false,"contextLength":32768,"pricing":[{"threshold":0,"input":2e-8,"output":3e-8}]},"qwen3-30b-a3b:neuronpool":{"providerModelId":"qwen3-30b-a3b","ptbEnabled":false,"contextLength":32768,"pricing":[{"threshold":0,"input":6e-8,"output":9e-8}]}}',
    );
  });
});
