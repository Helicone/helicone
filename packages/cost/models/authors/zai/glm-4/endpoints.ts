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
  "glm-4.7:novita": {
    providerModelId: "zai-org/glm-4.7",
    provider: "novita",
    author: "zai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000006,
        output: 0.0000022,
        cacheMultipliers: {
          cachedInput: 0.183, // $0.11/M cache read vs $0.60/M input
        },
      },
    ],
    quantization: "fp8",
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
  "glm-4.7:canopywave": {
    providerModelId: "zai/glm-4.7",
    provider: "canopywave",
    author: "zai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000043,
        output: 0.00000175,
      },
    ],
    quantization: "bf16",
    contextLength: 198_000,
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
  "glm-4.7:fireworks": {
    providerModelId: "accounts/fireworks/models/glm-4p7",
    provider: "fireworks",
    author: "zai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000006,
        output: 0.0000022,
        cacheMultipliers: {
          cachedInput: 0.5, // $0.30/M cache read vs $0.60/M input
        },
      },
    ],
    quantization: "fp8",
    contextLength: 198_000,
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
  "glm-4.6:baseten": {
    providerModelId: "zai-org/GLM-4.6",
    provider: "baseten",
    author: "zai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000006,
        output: 0.0000022,
      },
    ],
    quantization: "bf16",
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
      "logit_bias"
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "glm-4.7:baseten": {
    providerModelId: "zai-org/GLM-4.7",
    provider: "baseten",
    author: "zai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000006,
        output: 0.0000022,
      },
    ],
    quantization: "bf16",
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
      "logit_bias"
    ],
    ptbEnabled: true,
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
