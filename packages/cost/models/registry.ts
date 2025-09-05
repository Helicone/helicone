/**
 * Main registry with O(1) endpoint access
 */

import type {
  Endpoint,
  ModelConfig,
  ModelProviderConfig,
  UserEndpointConfig,
} from "./types";
import {
  buildIndexes,
  ModelIndexes,
  ModelProviderEntry,
} from "./build-indexes";
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

function getAllModelIds(): Result<ModelName[]> {
  return ok(Object.keys(allModels) as ModelName[]);
}

function getAllModelsWithIds(): Result<Record<ModelName, ModelConfig>> {
  return ok(allModels);
}

function getEndpointsByModel(model: string): Result<Endpoint[]> {
  const endpoints = indexes.modelToEndpoints.get(model as ModelName) || [];
  return ok(endpoints);
}

function createPassthroughEndpoint(
  modelName: string,
  provider: ModelProviderName,
  userEndpointConfig: UserEndpointConfig
): Result<Endpoint> {
  const endpointConfig: ModelProviderConfig = {
    providerModelId: modelName,
    ptbEnabled: false,
    provider,
    author: "passthrough",
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

function getModelProviderEntriesByModel(
  model: string
): Result<ModelProviderEntry[]> {
  const providerData =
    indexes.modelToProviderData.get(model as ModelName) || [];
  return ok(providerData);
}

function getModelProviderEntry(
  model: string,
  provider: string
): Result<ModelProviderEntry | null> {
  const configId = `${model}:${provider}` as ModelProviderConfigId;
  const providerData = indexes.modelProviderToData.get(configId) || null;
  return ok(providerData);
}

export const getPtbEndpoints = (model: string): Result<Endpoint[]> => {
  const endpoints = indexes.modelToPtbEndpoints.get(model as ModelName) || [];
  return ok(endpoints);
};

function getPtbEndpointsForProvider(
  provider: string
): Result<{ endpoint: Endpoint; model: ModelName }[]> {
  const topLevelEndpoints: { endpoint: Endpoint; model: ModelName }[] = [];
  indexes.modelToPtbEndpoints.forEach((endpoints, model) => {
    for (const endpoint of endpoints) {
      if (endpoint.provider === provider) {
        topLevelEndpoints.push({
          endpoint: endpoint,
          model: model as ModelName,
        });
      }
    }
  });
  return ok(topLevelEndpoints);
}

export const registry = {
  getAllModelIds,
  getAllModelsWithIds,
  createPassthroughEndpoint,
  getPtbEndpointsByProvider,
  getPtbEndpoints,
  getProviderModels,
  buildEndpoint,
  getModelProviderConfig,
  getPtbEndpointsForProvider,
  getModelProviderConfigs,
  getModelProviders,
  getEndpointsByModel,
  getModelProviderEntriesByModel,
  getModelProviderEntry,
};
