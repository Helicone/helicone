import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { DeepSeekR1ModelName } from "./models";

export const endpoints = {
  "deepseek-ai/DeepSeek-R1-Distill-Llama-70B:groq": {
    providerModelId: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
    provider: "groq",
    author: "deepseek",
    pricing: [
      {
        threshold: 0,
        input: 0.00000075,
        output: 0.00000099,
        request: 0.0,
        image: 0.0,
        audio: 0.0,
        web_search: 0.0,
      },
    ],
    contextLength: 128_000,
    maxCompletionTokens: 4_096,
    supportedParameters: [
      "frequency_penalty",
      "include_reasoning",
      "logit_bias",
      "logprobs",
      "max_tokens",
      "min_p",
      "presence_penalty",
      "reasoning",
      "repetition_penalty",
      "seed",
      "stop",
      "temperature",
      "top_k",
      "top_logprobs",
      "top_p"
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${DeepSeekR1ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
