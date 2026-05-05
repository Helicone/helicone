import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { MiniMaxM25ModelName } from "./model";

export const endpoints = {
  "minimax-m2.5:minimax": {
    provider: "minimax",
    author: "minimax",
    providerModelId: "MiniMax-M2.5",
    pricing: [
      {
        threshold: 0,
        input: 0.0000002, // $0.20 per 1M tokens
        output: 0.0000011, // $1.10 per 1M tokens
      },
    ],
    contextLength: 204_000,
    maxCompletionTokens: 8_192,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "stream",
      "tools",
      "tool_choice",
      "response_format",
      "frequency_penalty",
      "presence_penalty",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "minimax-m2.5-highspeed:minimax": {
    provider: "minimax",
    author: "minimax",
    providerModelId: "MiniMax-M2.5-highspeed",
    pricing: [
      {
        threshold: 0,
        input: 0.0000001, // $0.10 per 1M tokens
        output: 0.00000055, // $0.55 per 1M tokens
      },
    ],
    contextLength: 204_000,
    maxCompletionTokens: 8_192,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "stream",
      "tools",
      "tool_choice",
      "response_format",
      "frequency_penalty",
      "presence_penalty",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${MiniMaxM25ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
