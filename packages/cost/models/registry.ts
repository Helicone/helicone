/**
 * Main registry with O(1) endpoint access
 */

import type {
  Endpoint,
  ModelConfig,
  ModelProviderConfig,
  UserEndpointConfig,
} from "./types";
import { buildIndexes, ModelIndexes } from "./build-indexes";
import { buildEndpointUrl, buildModelId } from "./provider-helpers";
import { ModelProviderName } from "./providers";
import { Result, ok, err } from "../../common/result";
import { ModelName, ModelProviderConfigId, EndpointId } from "./registry-types";

// Import all models and endpoints from authors
import { anthropicModels, anthropicEndpointConfig } from "./authors/anthropic";
import { openaiModels, openaiEndpointConfig } from "./authors/openai";
import { googleModels, googleEndpointConfig } from "./authors/google";
import { grokModels, grokEndpointConfig } from "./authors/xai";

// Combine all models
const allModels = {
  ...anthropicModels,
  ...openaiModels,
  ...googleModels,
  ...grokModels,
} satisfies Record<string, ModelConfig>;

// Combine all endpoint configs
const modelProviderConfigs = {
  ...anthropicEndpointConfig,
  ...openaiEndpointConfig,
  ...googleEndpointConfig,
  ...grokEndpointConfig,
} satisfies Record<string, ModelProviderConfig>;

const indexes: ModelIndexes = buildIndexes(modelProviderConfigs);

function getModel(modelId: string): Result<ModelConfig> {
  const model = allModels[modelId as ModelName];
  return model ? ok(model) : err(`Model not found: ${modelId}`);
}

function getAllModels(): Result<ModelConfig[]> {
  return ok(Object.values(allModels));
}

function getAllModelIds(): Result<ModelName[]> {
  return ok(Object.keys(allModels) as ModelName[]);
}

function getAllModelsWithIds(): Result<Record<ModelName, ModelConfig>> {
  return ok(allModels);
}

function getPtbEndpointById(
  model: string,
  provider: string,
  endpointConfigId: string = "*"
): Result<Endpoint> {
  const endpointId = `${model}:${provider}:${endpointConfigId}`;
  const endpoint = indexes.endpointIdToEndpoint.get(endpointId as EndpointId);
  return endpoint ? ok(endpoint) : err(`Endpoint not found: ${endpointId}`);
}

function getPtbEndpoints(
  model: string, // Model name (gpt-4o, claude-3-5-haiku, etc)
  provider?: string, // Provider name (openai, anthropic, etc)
  endpointConfigId?: string // Deployment/region name (us-east-1, etc)
): Result<Endpoint[]> {
  // Case 1: Model + Provider + EndpointConfigId - return specific endpoint as array
  if (provider && endpointConfigId) {
    const result = getPtbEndpointById(model, provider, endpointConfigId);
    return result.error ? result : ok([result.data!]);
  }

  // Case 2: Model + Provider - return all endpoints for that provider
  if (provider) {
    return getPtbEndpointsByProvider(model, provider);
  }

  // Case 3: Model only - return all PTB endpoints
  return getPtbEndpointsByModel(model);
}

function getPtbEndpointsByModel(model: string): Result<Endpoint[]> {
  const endpoints = indexes.modelToPtbEndpoints.get(model as ModelName) || [];
  return ok(endpoints);
}

function getEndpointsByModel(model: string): Result<Endpoint[]> {
  const endpoints = indexes.modelToEndpoints.get(model as ModelName) || [];
  return ok(endpoints);
}

function createFallbackEndpoint(
  modelName: string,
  provider: ModelProviderName,
  userEndpointConfig: UserEndpointConfig
): Result<Endpoint> {
  const endpointConfig: ModelProviderConfig = {
    providerModelId: modelName,
    ptbEnabled: false,
    provider,
    author: "fallback",
    pricing: [
      {
        threshold: 0,
        input: 0,
        output: 0,
      },
    ],
    contextLength: 0,
    maxCompletionTokens: 0,
    supportedParameters: [],
    endpointConfigs: {},
  };

  return buildEndpoint(endpointConfig, userEndpointConfig);
}

function getPtbEndpointsByProvider(
  model: string,
  provider: string
): Result<Endpoint[]> {
  const configId = `${model}:${provider}` as ModelProviderConfigId;
  const endpoints = indexes.modelProviderIdToPtbEndpoints.get(configId) || [];
  return ok(endpoints);
}

function getProviderModels(provider: string): Result<Set<ModelName>> {
  const models =
    indexes.providerToModels.get(provider as ModelProviderName) || new Set();
  return ok(models);
}

function buildEndpoint(
  endpointConfig: ModelProviderConfig,
  userEndpointConfig: UserEndpointConfig
): Result<Endpoint> {
  const baseUrlResult = buildEndpointUrl(endpointConfig, userEndpointConfig);
  if (baseUrlResult.error) {
    return err(baseUrlResult.error);
  }

  const modelIdResult = buildModelId(endpointConfig, userEndpointConfig);
  if (modelIdResult.error) {
    return err(modelIdResult.error);
  }

  return ok({
    baseUrl: baseUrlResult.data ?? "",
    provider: endpointConfig.provider,
    author: endpointConfig.author,
    providerModelId: modelIdResult.data ?? "",
    supportedParameters: endpointConfig.supportedParameters,
    pricing: endpointConfig.pricing,
    contextLength: endpointConfig.contextLength,
    maxCompletionTokens: endpointConfig.maxCompletionTokens,
    ptbEnabled: false,
    version: endpointConfig.version,
  });
}

function getModelProviderConfig(
  model: string,
  provider: string
): Result<ModelProviderConfig> {
  const configId = `${model}:${provider}` as ModelProviderConfigId;
  const config = indexes.endpointConfigIdToEndpointConfig.get(configId);
  return config ? ok(config) : err(`Config not found: ${configId}`);
}

function getModelProviderConfigs(model: string): Result<ModelProviderConfig[]> {
  const configs = indexes.modelToEndpointConfigs.get(model as ModelName) || [];
  return ok(configs);
}

function getModelProviders(model: string): Result<Set<ModelProviderName>> {
  const providers =
    indexes.modelToProviders.get(model as ModelName) || new Set();
  return ok(providers);
}

function getPtbEndpointsWithIds(
  model: string,
  provider: string
): Result<Record<string, string>> {
  const result: Record<string, string> = {};
  const prefix = `${model}:${provider}:`;

  indexes.endpointIdToEndpoint.forEach((endpoint, endpointId) => {
    if (endpointId.startsWith(prefix) && endpoint.ptbEnabled) {
      const deploymentId = endpointId.substring(prefix.length);
      result[deploymentId] = endpoint.baseUrl;
    }
  });

  return ok(result);
}

export const registry = {
  getModel,
  getAllModels,
  getAllModelIds,
  getAllModelsWithIds,
  createFallbackEndpoint,
  getPtbEndpoints,
  getPtbEndpointById,
  getPtbEndpointsByModel,
  getPtbEndpointsByProvider,
  getPtbEndpointsWithIds,
  getProviderModels,
  buildEndpoint,
  buildModelId,
  getModelProviderConfig,
  getModelProviderConfigs,
  getModelProviders,
  getEndpointsByModel,
};
