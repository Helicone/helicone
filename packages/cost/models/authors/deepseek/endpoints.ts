/**
 * DeepSeek endpoint configurations
 */

import type { Endpoint, EndpointKey } from "../../types";
import type { DeepSeekModelName } from "./models";

export const deepseekEndpoints = {
  // "deepseek-chat:deepseek": {
  //   modelId: "deepseek-chat",
  //   provider: "deepseek",
  //   providerModelId: "deepseek-chat",
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
  //   providerModelId: "deepseek-reasoner",
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
} satisfies Record<EndpointKey<DeepSeekModelName>, Endpoint>;

export type DeepSeekEndpointId = EndpointKey<DeepSeekModelName>;
