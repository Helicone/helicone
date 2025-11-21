import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { CanopyWaveModelName } from "./models";

export const endpoints = {
  "kimi-k2-thinking:canopywave": {
    providerModelId: "kimi-k2-thinking",
    provider: "canopywave",
    author: "canopywave",
    pricing: [
      {
        threshold: 0,
        input: 0.00000048, // $0.48 per 1M tokens
        output: 0.000002, // $2.00 per 1M tokens
        request: 0.0,
        image: 0.0,
        audio: 0.0,
        web_search: 0.0,
      },
    ],
    contextLength: 256_000,
    maxCompletionTokens: 262_144,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "tools",
      "tool_choice",
      "response_format",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${CanopyWaveModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
