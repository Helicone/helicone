import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Glm5ModelName } from "./models";

export const endpoints = {
  "glm-5.2:scx": {
    providerModelId: "GLM-5.2",
    provider: "scx",
    author: "zai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000066,
        output: 0.0000023106,
        cacheMultipliers: {
          cachedInput: 0.25, // $0.165/M cache read vs $0.66/M input
        },
      },
    ],
    quantization: "fp8",
    contextLength: 1_000_000,
    // SCX rejects max_tokens above 131072 even though the model card advertises 128k
    maxCompletionTokens: 131_072,
    supportedParameters: [
      "functions",
      "structured_outputs",
      "reasoning",
      "tool_choice",
      "tools",
      "response_format",
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "seed",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<
    `${Glm5ModelName}:${ModelProviderName}` | Glm5ModelName,
    ModelProviderConfig
  >
>;
