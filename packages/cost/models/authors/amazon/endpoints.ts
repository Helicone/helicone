/**
 * Amazon endpoint configurations
 */

import type { Endpoint, EndpointKey } from "../../types";
import { AmazonModelName } from "./models";

export const amazonEndpoints = {
  // "nova-lite-v1:bedrock": {
  //   modelId: "nova-lite-v1",
  //   provider: "bedrock",
  //   providerModelId: "amazon.nova-lite-v1:0",
  //   pricing: {
  //     prompt: 0.06,
  //     completion: 0.24,
  //   },
  //   contextLength: 300000,
  //   maxCompletionTokens: 5120,
  //   supportedParameters: [
  //     "tools",
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "top_k",
  //     "stop",
  //   ],
  //   ptbEnabled: false,
  // },
  // "nova-micro-v1:bedrock": {
  //   modelId: "nova-micro-v1",
  //   provider: "bedrock",
  //   providerModelId: "amazon.nova-micro-v1:0",
  //   pricing: {
  //     prompt: 0.035,
  //     completion: 0.14,
  //   },
  //   contextLength: 128000,
  //   maxCompletionTokens: 5120,
  //   supportedParameters: [
  //     "tools",
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "top_k",
  //     "stop",
  //   ],
  //   ptbEnabled: false,
  // },
  // "nova-pro-v1:bedrock": {
  //   modelId: "nova-pro-v1",
  //   provider: "bedrock",
  //   providerModelId: "amazon.nova-pro-v1:0",
  //   pricing: {
  //     prompt: 0.8,
  //     completion: 3.2,
  //   },
  //   contextLength: 300000,
  //   maxCompletionTokens: 5120,
  //   supportedParameters: [
  //     "tools",
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "top_k",
  //     "stop",
  //   ],
  //   ptbEnabled: false,
  // },
} satisfies Record<EndpointKey<AmazonModelName>, Endpoint>;

export type AmazonEndpointId = keyof typeof amazonEndpoints;
