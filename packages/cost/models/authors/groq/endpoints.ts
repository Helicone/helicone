/**
 * Groq endpoint definitions with accurate pricing
 */

import type { Endpoint, EndpointKey } from "../../types";
import { GroqModelName } from "./models";

export const groqEndpoints = {
  "llama-3.3-70b-versatile:groq": {
    modelId: "llama-3.3-70b-versatile",
    provider: "groq",
    providerModelId: "llama-3.3-70b-versatile",
    pricing: {
      prompt: 0.59, // USD per million tokens
      completion: 0.79, // USD per million tokens
    },
    contextLength: 131072,
    maxCompletionTokens: 32768,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "stream",
    ],
    ptbEnabled: false,
  },

  "llama-3.1-8b-instant:groq": {
    modelId: "llama-3.1-8b-instant",
    provider: "groq",
    providerModelId: "llama-3.1-8b-instant",
    pricing: {
      prompt: 0.05, // USD per million tokens
      completion: 0.08, // USD per million tokens
    },
    contextLength: 131072,
    maxCompletionTokens: 32768,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "stream",
    ],
    ptbEnabled: false,
  },

  "llama-guard-4-12b:groq": {
    modelId: "llama-guard-4-12b",
    provider: "groq",
    providerModelId: "meta-llama/llama-guard-4-12b",
    pricing: {
      prompt: 0.2, // USD per million tokens
      completion: 0.2, // USD per million tokens
    },
    contextLength: 131072,
    maxCompletionTokens: 32768,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "stream",
    ],
    ptbEnabled: false,
  },

  "deepseek-r1-distill-llama-70b:groq": {
    modelId: "deepseek-r1-distill-llama-70b",
    provider: "groq",
    providerModelId: "deepseek-r1-distill-llama-70b",
    pricing: {
      prompt: 0.75, // USD per million tokens
      completion: 0.99, // USD per million tokens
    },
    contextLength: 131072,
    maxCompletionTokens: 32768,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "stream",
    ],
    ptbEnabled: false,
  },

  "llama-4-maverick-17b-128e-instruct:groq": {
    modelId: "llama-4-maverick-17b-128e-instruct",
    provider: "groq",
    providerModelId: "meta-llama/llama-4-maverick-17b-128e-instruct",
    pricing: {
      prompt: 0.2, // USD per million tokens
      completion: 0.6, // USD per million tokens
    },
    contextLength: 131072,
    maxCompletionTokens: 32768,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "stream",
    ],
    ptbEnabled: false,
  },

  "llama-4-scout-17b-16e-instruct:groq": {
    modelId: "llama-4-scout-17b-16e-instruct",
    provider: "groq",
    providerModelId: "meta-llama/llama-4-scout-17b-16e-instruct",
    pricing: {
      prompt: 0.11, // USD per million tokens
      completion: 0.34, // USD per million tokens
    },
    contextLength: 131072,
    maxCompletionTokens: 32768,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "stream",
    ],
    ptbEnabled: false,
  },

  "qwen3-32b:groq": {
    modelId: "qwen3-32b",
    provider: "groq",
    providerModelId: "qwen/qwen3-32b",
    pricing: {
      prompt: 0.29, // USD per million tokens
      completion: 0.59, // USD per million tokens
    },
    contextLength: 131072,
    maxCompletionTokens: 32768,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "stream",
    ],
    ptbEnabled: false,
  },

  "whisper-large-v3:groq": {
    modelId: "whisper-large-v3",
    provider: "groq",
    providerModelId: "whisper-large-v3",
    pricing: {
      prompt: 0.11, // USD per million tokens (estimated for audio processing)
      completion: 0.11, // USD per million tokens (estimated for audio processing)
    },
    contextLength: 448,
    maxCompletionTokens: 448,
    supportedParameters: ["temperature"],
    ptbEnabled: false,
  },

  "whisper-large-v3-turbo:groq": {
    modelId: "whisper-large-v3-turbo",
    provider: "groq",
    providerModelId: "whisper-large-v3-turbo",
    pricing: {
      prompt: 0.04, // USD per million tokens (estimated for turbo audio processing)
      completion: 0.04, // USD per million tokens (estimated for turbo audio processing)
    },
    contextLength: 448,
    maxCompletionTokens: 448,
    supportedParameters: ["temperature"],
    ptbEnabled: false,
  },
} satisfies Record<EndpointKey<GroqModelName>, Endpoint>;

export type GroqEndpointId = keyof typeof groqEndpoints;
