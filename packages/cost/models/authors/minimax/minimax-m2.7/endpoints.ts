import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { MiniMaxM27ModelName } from "./model";

export const endpoints = {
  "minimax-m2.7:minimax": {
    provider: "minimax",
    author: "minimax",
    providerModelId: "MiniMax-M2.7",
    pricing: [
      {
        threshold: 0,
        input: 0.0000002, // $0.20 per 1M tokens
        output: 0.0000011, // $1.10 per 1M tokens
      },
    ],
    contextLength: 1_000_000,
    maxCompletionTokens: 16_384,
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
  "minimax-m2.7-highspeed:minimax": {
    provider: "minimax",
    author: "minimax",
    providerModelId: "MiniMax-M2.7-highspeed",
    pricing: [
      {
        threshold: 0,
        input: 0.0000001, // $0.10 per 1M tokens
        output: 0.00000055, // $0.55 per 1M tokens
      },
    ],
    contextLength: 1_000_000,
    maxCompletionTokens: 16_384,
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
  Record<`${MiniMaxM27ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
