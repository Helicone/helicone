import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { ZaiModelName } from "./models";

export const endpoints = {
  "glm-4.6:novita": {
    providerModelId: "zai-org/glm-4.6",
    provider: "novita",
    author: "zai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000006,
        output: 0.0000022
      },
    ],
    quantization: "bf16",
    contextLength: 204_800,
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
      "top_k",
      "min_p",
      "repetition_penalty",
      "logit_bias"
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "glm-4.6:canopywave": {
    providerModelId: "zai/glm-4.6",
    provider: "canopywave",
    author: "zai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000045,
        output: 0.0000015,
      },
    ],
    quantization: "bf16",
    contextLength: 204_800,
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
      "top_k",
      "min_p",
      "repetition_penalty",
      "logit_bias"
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  // io.net Intelligence endpoints
  "glm-4.6:io-intelligence": {
    providerModelId: "zai-org/GLM-4.6",
    provider: "io-intelligence",
    author: "zai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000035, // $0.35 per 1M tokens
        output: 0.0000015, // $1.50 per 1M tokens
        cacheMultipliers: {
          cachedInput: 0.5, // $0.175 per 1M tokens (cached)
        },
      },
    ],
    quantization: "fp8",
    contextLength: 200_000,
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
      "top_k",
      "min_p",
      "repetition_penalty",
      "logit_bias",
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
  "glm-4.7:io-intelligence": {
    providerModelId: "zai-org/GLM-4.7",
    provider: "io-intelligence",
    author: "zai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000003, // $0.30 per 1M tokens
        output: 0.0000014, // $1.40 per 1M tokens
        cacheMultipliers: {
          cachedInput: 0.5, // $0.15 per 1M tokens (cached)
        },
      },
    ],
    quantization: "fp16",
    contextLength: 200_000,
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
      "top_k",
      "min_p",
      "repetition_penalty",
      "logit_bias",
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<
    `${ZaiModelName}:${ModelProviderName}` | ZaiModelName,
    ModelProviderConfig
  >
>;
