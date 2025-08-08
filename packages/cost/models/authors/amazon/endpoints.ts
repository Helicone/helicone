/**
 * Amazon endpoint configurations
 */

import type { ModelEndpointMap } from "../../types";
import type { AmazonModelName } from "./models";

export const amazonEndpoints = {
  "nova-lite-v1": {
    bedrock: {
      name: "Amazon Bedrock | amazon/nova-lite-v1",
      pricing: {
        prompt: 0.06,
        completion: 0.24,
        image: 0.00009,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 300000,
      maxCompletionTokens: 5120,
      supportedParameters: [
        "tools",
        "max_tokens",
        "temperature",
        "top_p",
        "top_k",
        "stop",
      ],
    },
  },

  "nova-micro-v1": {
    bedrock: {
      name: "Amazon Bedrock | amazon/nova-micro-v1",
      pricing: {
        prompt: 0.035,
        completion: 0.14,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 128000,
      maxCompletionTokens: 5120,
      supportedParameters: [
        "tools",
        "max_tokens",
        "temperature",
        "top_p",
        "top_k",
        "stop",
      ],
    },
  },

  "nova-pro-v1": {
    bedrock: {
      name: "Amazon Bedrock | amazon/nova-pro-v1",
      pricing: {
        prompt: 0.8,
        completion: 3.2,
        image: 0.0012,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 300000,
      maxCompletionTokens: 5120,
      supportedParameters: [
        "tools",
        "max_tokens",
        "temperature",
        "top_p",
        "top_k",
        "stop",
      ],
    },
  },
} satisfies Record<AmazonModelName, ModelEndpointMap>;

export default amazonEndpoints;
