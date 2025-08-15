/**
 * DeepSeek endpoint configurations
 */

import type { ModelProviderConfig } from "../../types";

export const deepseekEndpoints = {
  // "deepseek-chat:deepseek": {
  //   modelId: "deepseek-chat",
  //   provider: "deepseek",
  //   baseModelId: "deepseek-chat",
  //   pricing: {
  //     prompt: 0.27, // USD per million tokens (cache miss, standard rate)
  //     completion: 1.1, // USD per million tokens (standard rate)
  //     cacheRead: 0.07, // USD per million tokens (cache hit rate)
  //   },
  //   contextLength: 65536,
  //   maxCompletionTokens: 8192,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "stop",
  //     "stream",
  //     "functions",
  //     "function_call",
  //     "tools",
  //     "tool_choice",
  //     "response_format",
  //   ],
  //   ptbEnabled: false,
  // },
  // "deepseek-reasoner:deepseek": {
  //   modelId: "deepseek-reasoner",
  //   provider: "deepseek",
  //   baseModelId: "deepseek-reasoner",
  //   pricing: {
  //     prompt: 0.55, // USD per million tokens (cache miss, standard rate)
  //     completion: 2.19, // USD per million tokens (standard rate)
  //     cacheRead: 0.14, // USD per million tokens (cache hit rate)
  //   },
  //   contextLength: 65536,
  //   maxCompletionTokens: 65536,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "stop",
  //     "stream",
  //     "response_format",
  //   ],
  //   ptbEnabled: false,
  // },
} satisfies Record<string, ModelProviderConfig>;

export type DeepSeekEndpointId = string;
