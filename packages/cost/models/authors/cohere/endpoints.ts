/**
 * Cohere endpoint configurations
 */

import type { Endpoint, EndpointKey } from "../../types";
import { CohereModelName } from "./models";

export const cohereEndpoints = {
  // // Removed speculative/estimated models until verified
  // /* "command-a-03-2025:cohere": {
  //   modelId: "command-a-03-2025",
  //   provider: "cohere",
  //   baseModelId: "command-a-03-2025",
  //   pricing: {
  //     prompt: 3.0, // USD per million tokens (estimated flagship pricing)
  //     completion: 15.0, // USD per million tokens (estimated flagship pricing)
  //   },
  //   contextLength: 262144,
  //   maxCompletionTokens: 8192,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "top_k",
  //     "stop",
  //     "stream",
  //     "tools",
  //     "tool_choice",
  //   ],
  //   ptbEnabled: false,
  // }, */
  // "command-r-plus:cohere": {
  //   modelId: "command-r-plus",
  //   provider: "cohere",
  //   baseModelId: "command-r-plus",
  //   pricing: {
  //     prompt: 2.5, // USD per million tokens
  //     completion: 10.0, // USD per million tokens
  //   },
  //   contextLength: 131072,
  //   maxCompletionTokens: 4096,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "top_k",
  //     "stop",
  //     "stream",
  //     "tools",
  //     "tool_choice",
  //   ],
  //   ptbEnabled: false,
  // },
  // "command-r:cohere": {
  //   modelId: "command-r",
  //   provider: "cohere",
  //   baseModelId: "command-r",
  //   pricing: {
  //     prompt: 0.5, // USD per million tokens
  //     completion: 1.5, // USD per million tokens
  //   },
  //   contextLength: 131072,
  //   maxCompletionTokens: 4096,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "top_k",
  //     "stop",
  //     "stream",
  //     "tools",
  //     "tool_choice",
  //   ],
  //   ptbEnabled: false,
  // },
  // "command-light:cohere": {
  //   modelId: "command-light",
  //   provider: "cohere",
  //   baseModelId: "command-light",
  //   pricing: {
  //     prompt: 0.3, // USD per million tokens
  //     completion: 0.6, // USD per million tokens
  //   },
  //   contextLength: 4096,
  //   maxCompletionTokens: 4096,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "top_k",
  //     "stop",
  //     "stream",
  //   ],
  //   ptbEnabled: false,
  // },
  // "c4ai-aya-expanse-32b:cohere": {
  //   modelId: "c4ai-aya-expanse-32b",
  //   provider: "cohere",
  //   baseModelId: "c4ai-aya-expanse-32b",
  //   pricing: {
  //     prompt: 0.5, // USD per million tokens
  //     completion: 1.5, // USD per million tokens
  //   },
  //   contextLength: 8192,
  //   maxCompletionTokens: 4096,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "top_k",
  //     "stop",
  //     "stream",
  //   ],
  //   ptbEnabled: false,
  // },
  // "c4ai-aya-expanse-8b:cohere": {
  //   modelId: "c4ai-aya-expanse-8b",
  //   provider: "cohere",
  //   baseModelId: "c4ai-aya-expanse-8b",
  //   pricing: {
  //     prompt: 0.5, // USD per million tokens
  //     completion: 1.5, // USD per million tokens
  //   },
  //   contextLength: 8192,
  //   maxCompletionTokens: 4096,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "top_k",
  //     "stop",
  //     "stream",
  //   ],
  //   ptbEnabled: false,
  // },
  // /* "embed-english-v3.0:cohere": {
  //   modelId: "embed-english-v3.0",
  //   provider: "cohere",
  //   baseModelId: "embed-english-v3.0",
  //   pricing: {
  //     prompt: 0.1, // USD per million tokens (estimated embedding pricing)
  //     completion: 0.0, // Embedding models don't have completion tokens
  //   },
  //   contextLength: 512,
  //   maxCompletionTokens: 1024,
  //   supportedParameters: ["truncate"],
  //   ptbEnabled: false,
  // }, */
  // /* "embed-multilingual-v3.0:cohere": {
  //   modelId: "embed-multilingual-v3.0",
  //   provider: "cohere",
  //   baseModelId: "embed-multilingual-v3.0",
  //   pricing: {
  //     prompt: 0.1, // USD per million tokens (estimated embedding pricing)
  //     completion: 0.0, // Embedding models don't have completion tokens
  //   },
  //   contextLength: 512,
  //   maxCompletionTokens: 1024,
  //   supportedParameters: ["truncate"],
  //   ptbEnabled: false,
  // }, */
  // // Bedrock endpoints for some Cohere models
  // "command-r-plus:bedrock": {
  //   modelId: "command-r-plus",
  //   provider: "bedrock",
  //   baseModelId: "cohere.command-r-plus-v1:0",
  //   pricing: {
  //     prompt: 3.0, // USD per million tokens (Bedrock pricing)
  //     completion: 15.0, // USD per million tokens (Bedrock pricing)
  //   },
  //   contextLength: 131072,
  //   maxCompletionTokens: 4096,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "top_k",
  //     "stop",
  //   ],
  //   ptbEnabled: false,
  // },
  // "command-r:bedrock": {
  //   modelId: "command-r",
  //   provider: "bedrock",
  //   baseModelId: "cohere.command-r-v1:0",
  //   pricing: {
  //     prompt: 0.5, // USD per million tokens (Bedrock pricing)
  //     completion: 1.5, // USD per million tokens (Bedrock pricing)
  //   },
  //   contextLength: 131072,
  //   maxCompletionTokens: 4096,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "top_k",
  //     "stop",
  //   ],
  //   ptbEnabled: false,
  // },
} satisfies Record<EndpointKey<CohereModelName>, Endpoint>;

export type CohereEndpointId = keyof typeof cohereEndpoints;
