/**
 * Provider configurations for URL and model ID building
 */

import { err, ok, Result } from "../../common/result";
import {
  ModelProviderConfig,
  ProviderConfig,
  UserEndpointConfig,
} from "./types";

export const providers = {
  anthropic: {
    baseUrl: "https://api.anthropic.com",
    auth: "api-key",
    buildUrl: () => "https://api.anthropic.com/v1/chat/completions",
    buildModelId: (endpointConfig: ModelProviderConfig) =>
      endpointConfig.providerModelId,
    pricingPages: [
      "https://docs.anthropic.com/en/docs/build-with-claude/pricing",
    ],
    modelPages: [
      "https://docs.anthropic.com/en/docs/about-claude/models/all-models",
    ],
  },

  openai: {
    baseUrl: "https://api.openai.com",
    auth: "api-key",
    buildUrl: () => "https://api.openai.com/v1/chat/completions",
    buildModelId: (endpointConfig: ModelProviderConfig) =>
      endpointConfig.providerModelId,
    pricingPages: ["https://openai.com/api/pricing"],
    modelPages: ["https://platform.openai.com/docs/models"],
  },

  bedrock: {
    baseUrl: "https://bedrock-runtime.{region}.amazonaws.com",
    auth: "aws-signature",
    requiredConfig: ["region"],
    buildUrl: (
      endpointConfig: ModelProviderConfig,
      userConfig: UserEndpointConfig
    ) => {
      const region = userConfig.region || "us-east-1";
      const modelId = endpointConfig.providerModelId;
      return `https://bedrock-runtime.${region}.amazonaws.com/model/${modelId}/invoke`;
    },
    buildModelId: (
      endpointConfig: ModelProviderConfig,
      userConfig: UserEndpointConfig
    ) => {
      // Handle cross-region access
      if (userConfig.crossRegion && userConfig.region) {
        // Extract base model ID without region prefix
        const baseModelId = endpointConfig.providerModelId.replace(
          /^[a-z]{2}\./,
          ""
        );
        const regionPrefix = userConfig.region.split("-")[0];
        return `${regionPrefix}.${baseModelId}`;
      }
      return endpointConfig.providerModelId;
    },
    pricingPages: ["https://aws.amazon.com/bedrock/pricing/"],
    modelPages: [
      "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
    ],
  },

  vertex: {
    baseUrl: "https://aiplatform.googleapis.com",
    auth: "oauth",
    requiredConfig: ["projectId", "region"],
    buildUrl: (
      endpointConfig: ModelProviderConfig,
      userConfig: UserEndpointConfig
    ) => {
      const { projectId, region } = userConfig;
      if (!projectId || !region) {
        throw new Error("Vertex AI requires projectId and region");
      }
      const modelId = endpointConfig.providerModelId;
      return `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/anthropic/models/${modelId}:streamRawPredict`;
    },
    buildModelId: (endpointConfig: ModelProviderConfig) =>
      endpointConfig.providerModelId,
    pricingPages: [
      "https://cloud.google.com/vertex-ai/generative-ai/pricing",
      "https://ai.google.dev/pricing",
    ],
    modelPages: [
      "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models",
    ],
  },

  "azure-openai": {
    baseUrl: "https://{resourceName}.openai.azure.com",
    auth: "api-key",
    requiredConfig: ["resourceName", "deploymentName"],
    buildUrl: (
      endpointConfig: ModelProviderConfig,
      userConfig: UserEndpointConfig
    ) => {
      const { resourceName, deploymentName } = userConfig;
      if (!resourceName || !deploymentName) {
        throw new Error(
          "Azure OpenAI requires resourceName and deploymentName"
        );
      }
      const apiVersion = "2024-02-15-preview";
      return `https://${resourceName}.openai.azure.com/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
    },
    buildModelId: (endpointConfig: ModelProviderConfig) =>
      endpointConfig.providerModelId,
    pricingPages: [
      "https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/",
    ],
    modelPages: [
      "https://learn.microsoft.com/azure/ai-services/openai/concepts/models",
    ],
  },

  perplexity: {
    baseUrl: "https://api.perplexity.ai",
    auth: "api-key",
    buildUrl: () => "https://api.perplexity.ai/chat/completions",
    buildModelId: (endpointConfig: ModelProviderConfig) =>
      endpointConfig.providerModelId,
    pricingPages: ["https://docs.perplexity.ai/guides/pricing"],
    modelPages: ["https://docs.perplexity.ai/guides/models"],
  },

  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    auth: "api-key",
    buildUrl: () => "https://api.groq.com/openai/v1/chat/completions",
    buildModelId: (endpointConfig: ModelProviderConfig) =>
      endpointConfig.providerModelId,
    pricingPages: [
      "https://console.groq.com/pricing",
      "https://groq.com/pricing/",
    ],
    modelPages: ["https://console.groq.com/docs/models"],
  },

  deepseek: {
    baseUrl: "https://api.deepseek.com",
    auth: "api-key",
    buildUrl: () => "https://api.deepseek.com/chat/completions",
    buildModelId: (endpointConfig: ModelProviderConfig) =>
      endpointConfig.providerModelId,
    pricingPages: ["https://api-docs.deepseek.com/"],
    modelPages: ["https://api-docs.deepseek.com/"],
  },

  cohere: {
    baseUrl: "https://api.cohere.ai",
    auth: "api-key",
    buildUrl: () => "https://api.cohere.ai/v1/chat",
    buildModelId: (endpointConfig: ModelProviderConfig) =>
      endpointConfig.providerModelId,
    pricingPages: ["https://cohere.com/pricing"],
    modelPages: ["https://docs.cohere.com/docs/models"],
  },

  xai: {
    baseUrl: "https://api.x.ai",
    auth: "api-key",
    buildUrl: () => "https://api.x.ai/v1/chat/completions",
    buildModelId: (endpointConfig: ModelProviderConfig) =>
      endpointConfig.providerModelId,
    pricingPages: ["https://docs.x.ai/docs/pricing"],
    modelPages: ["https://docs.x.ai/docs/models"],
  },
} satisfies Record<string, ProviderConfig>;

export type ProviderName = keyof typeof providers;

export function getProvider(providerName: string): Result<ProviderConfig> {
  const provider =
    providerName in providers
      ? providers[providerName as ProviderName]
      : undefined;

  return provider ? ok(provider) : err(`Unknown provider: ${providerName}`);
}

// TODO: Remove once we normalize provider names in provider_keys table.
export const dbProviderToProvider = (provider: string): ProviderName | null => {
  if (provider === "openai" || provider === "OpenAI") {
    return "openai";
  }
  if (provider === "Anthropic") {
    return "anthropic";
  }
  if (provider === "AWS Bedrock") {
    return "bedrock";
  }
  if (provider === "Vertex AI") {
    return "vertex";
  }
  return null;
};

export const providerToDbProvider = (provider: ProviderName): string => {
  if (provider === "openai") {
    return "OpenAI";
  }
  if (provider === "anthropic") {
    return "Anthropic";
  }
  if (provider === "bedrock") {
    return "AWS Bedrock";
  }
  if (provider === "vertex") {
    return "Vertex AI";
  }
  return provider;
};

// Helper function to build URL for an endpoint
export function buildEndpointUrl(
  endpointConfig: ModelProviderConfig,
  userConfig: UserEndpointConfig = {}
): Result<string> {
  const providerResult = getProvider(endpointConfig.provider);
  if (providerResult.error) {
    return err(providerResult.error);
  }

  const provider = providerResult.data;
  if (!provider) {
    return err(`Provider data is null for: ${endpointConfig.provider}`);
  }

  try {
    // Merge endpoint deployment/region with user config
    const config: UserEndpointConfig = {
      ...userConfig,
      region: userConfig.region,
    };

    const url = provider.buildUrl(endpointConfig, userConfig);
    return ok(url);
  } catch (error) {
    return err(error instanceof Error ? error.message : "Failed to build URL");
  }
}

// Helper function to build model ID for an endpoint
export function buildModelId(
  endpointConfig: ModelProviderConfig,
  userConfig: UserEndpointConfig = {}
): Result<string> {
  const providerResult = getProvider(endpointConfig.provider);
  if (providerResult.error) {
    return err(providerResult.error);
  }

  const provider = providerResult.data;
  if (!provider) {
    return err(`Provider data is null for: ${endpointConfig.provider}`);
  }

  if (!provider.buildModelId) {
    return ok(endpointConfig.providerModelId);
  }

  try {
    // Merge endpoint deployment/region with user config
    const config: UserEndpointConfig = {
      ...userConfig,
      region: userConfig.region,
    };

    const modelId = provider.buildModelId(endpointConfig, config);
    return ok(modelId);
  } catch (error) {
    return err(
      error instanceof Error ? error.message : "Failed to build model ID"
    );
  }
}
