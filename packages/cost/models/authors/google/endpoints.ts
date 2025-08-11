/**
 * Google endpoint definitions with accurate pricing
 */

import type { Endpoint, EndpointKey } from "../../types";
import { GoogleModelName } from "./models";

export const googleEndpoints = {
  "gemini-2.5-pro:vertex": {
    modelId: "gemini-2.5-pro",
    provider: "vertex",
    providerModelId: "gemini-2.5-pro",
    pricing: {
      prompt: 1.25, // USD per million tokens (≤200k tokens)
      completion: 10.0, // USD per million tokens (≤200k tokens)
      // Note: >200k tokens: prompt: 2.50, completion: 15.00
    },
    contextLength: 2000000,
    maxCompletionTokens: 32768,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "top_k",
      "stop",
      "response_format",
    ],
    ptbEnabled: false,
  },

  "gemini-2.5-flash:vertex": {
    modelId: "gemini-2.5-flash",
    provider: "vertex",
    providerModelId: "gemini-2.5-flash",
    pricing: {
      prompt: 0.3, // USD per million tokens
      completion: 2.5, // USD per million tokens
      // Note: thinking mode output: 3.50, audio input: 1.00
    },
    contextLength: 1000000,
    maxCompletionTokens: 32768,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "top_k",
      "stop",
      "response_format",
    ],
    ptbEnabled: false,
  },

  "gemini-2.0-flash:vertex": {
    modelId: "gemini-2.0-flash",
    provider: "vertex",
    providerModelId: "gemini-2.0-flash",
    pricing: {
      prompt: 0.1, // USD per million tokens
      completion: 0.4, // USD per million tokens
      // Note: audio input: 0.70
    },
    contextLength: 1000000,
    maxCompletionTokens: 32768,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "top_k",
      "stop",
      "tools",
      "tool_choice",
      "response_format",
    ],
    ptbEnabled: false,
  },

  "gemini-1.5-pro:vertex": {
    modelId: "gemini-1.5-pro",
    provider: "vertex",
    providerModelId: "gemini-1.5-pro",
    pricing: {
      prompt: 1.25, // USD per million tokens (≤128k tokens)
      completion: 5.0, // USD per million tokens (≤128k tokens)
      // Note: >128k tokens: prompt: 2.50, completion: 10.00
    },
    contextLength: 2000000,
    maxCompletionTokens: 8192,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "top_k",
      "stop",
      "tools",
      "tool_choice",
    ],
    ptbEnabled: false,
  },

  "gemini-1.5-flash:vertex": {
    modelId: "gemini-1.5-flash",
    provider: "vertex",
    providerModelId: "gemini-1.5-flash",
    pricing: {
      prompt: 0.075, // USD per million tokens (≤128k tokens)
      completion: 0.3, // USD per million tokens (≤128k tokens)
      // Note: >128k tokens: prompt: 0.15, completion: 0.60
    },
    contextLength: 1000000,
    maxCompletionTokens: 8192,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "top_k",
      "stop",
      "tools",
      "tool_choice",
    ],
    ptbEnabled: false,
  },
} satisfies Record<EndpointKey<GoogleModelName>, Endpoint>;

export type GoogleEndpointId = keyof typeof googleEndpoints;
