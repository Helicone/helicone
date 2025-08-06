/**
 * Amazon endpoint configurations
 */

import type { ModelEndpoint } from "../../types";

export const amazonEndpoints: Record<string, ModelEndpoint[]> = {
  "nova-lite-v1": [
    {
      name: "Amazon Bedrock | amazon/nova-lite-v1",
      provider: "bedrock",
      tag: "amazon-bedrock",
      status: 0,
      pricing: {
        prompt: 0.06,
        completion: 0.24,
        image: 0.00009,
        cacheRead: null,
        cacheWrite: null
      },
      contextLength: 300000,
      maxCompletionTokens: 5120,
      supportedParameters: [
        "tools",
        "max_tokens",
        "temperature",
        "top_p",
        "top_k",
        "stop"
      ]
    }
  ],
  
  "nova-micro-v1": [
    {
      name: "Amazon Bedrock | amazon/nova-micro-v1",
      provider: "bedrock",
      tag: "amazon-bedrock",
      status: 0,
      pricing: {
        prompt: 0.035,
        completion: 0.14,
        cacheRead: null,
        cacheWrite: null
      },
      contextLength: 128000,
      maxCompletionTokens: 5120,
      supportedParameters: [
        "tools",
        "max_tokens",
        "temperature",
        "top_p",
        "top_k",
        "stop"
      ]
    }
  ],
  
  "nova-pro-v1": [
    {
      name: "Amazon Bedrock | amazon/nova-pro-v1",
      provider: "bedrock",
      tag: "amazon-bedrock",
      status: 0,
      pricing: {
        prompt: 0.8,
        completion: 3.2,
        image: 0.0012,
        cacheRead: null,
        cacheWrite: null
      },
      contextLength: 300000,
      maxCompletionTokens: 5120,
      supportedParameters: [
        "tools",
        "max_tokens",
        "temperature",
        "top_p",
        "top_k",
        "stop"
      ]
    }
  ]
};

export default amazonEndpoints;