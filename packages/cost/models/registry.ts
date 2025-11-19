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
import { buildModelId } from "./provider-helpers";
import { ModelProviderName, providers } from "./providers";
import { Result, ok, err } from "../../common/result";
import { ModelName, ModelProviderConfigId } from "./registry-types";

// Import all models and endpoints from authors
import { anthropicModels, anthropicEndpointConfig } from "./authors/anthropic";
import { openaiModels, openaiEndpointConfig } from "./authors/openai";
import { googleModels, googleEndpointConfig } from "./authors/google";
import { grokModels, grokEndpointConfig } from "./authors/xai";
import { metaModels, metaEndpointConfig } from "./authors/meta";
import {
  moonshotaiModels,
  moonshotaiEndpointConfig,
} from "./authors/moonshotai";
import { alibabaModels, alibabaEndpointConfig } from "./authors/alibaba";
import { deepseekModels, deepseekEndpointConfig } from "./authors/deepseek";
import { mistralModels, mistralEndpointConfig } from "./authors/mistral";
import { zaiModels, zaiEndpointConfig } from "./authors/zai";
import { baiduModels, baiduEndpointConfig } from "./authors/baidu";

// Combine all models
const allModels = {
  ...anthropicModels,
  ...openaiModels,
  ...googleModels,
  ...grokModels,
  ...metaModels,
  ...moonshotaiModels,
  ...alibabaModels,
  ...deepseekModels,
  ...mistralModels,
  ...zaiModels,
  ...baiduModels,
} satisfies Record<string, ModelConfig>;

// Combine all endpoint configs
const modelProviderConfigs = {
  ...anthropicEndpointConfig,
  ...openaiEndpointConfig,
  ...googleEndpointConfig,
  ...grokEndpointConfig,
  ...metaEndpointConfig,
  ...moonshotaiEndpointConfig,
  ...alibabaEndpointConfig,
  ...deepseekEndpointConfig,
  ...mistralEndpointConfig,
  ...zaiEndpointConfig,
  ...baiduEndpointConfig,
} satisfies Record<string, ModelProviderConfig>;

// Combine all archived endpoints
const archivedModelProviderConfigs = {
  // TODO: if any archived endpoints are added, make sure they are included here
} satisfies Record<string, ModelProviderConfig>;

const indexes: ModelIndexes = buildIndexes(
  modelProviderConfigs,
  archivedModelProviderConfigs
);

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
  // Get the provider's supported plugins
  const providerInstance = providers[provider];
  const supportedPlugins = providerInstance?.supportedPlugins;

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
    // Use the provider's supportedPlugins if available
    supportedPlugins:
      supportedPlugins && supportedPlugins.length > 0
        ? supportedPlugins
        : undefined,
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
  const modelIdResult = buildModelId(endpointConfig, userEndpointConfig);
  if (modelIdResult.error) {
    return err(modelIdResult.error);
  }

  return ok({
    modelConfig: endpointConfig,
    userConfig: userEndpointConfig,
    provider: endpointConfig.provider,
    author: endpointConfig.author,
    providerModelId: modelIdResult.data ?? "",
    supportedParameters: endpointConfig.supportedParameters,
    pricing: endpointConfig.pricing,
    contextLength: endpointConfig.contextLength,
    maxCompletionTokens: endpointConfig.maxCompletionTokens,
    ptbEnabled: false,
    version: endpointConfig.version,
    priority: endpointConfig.priority,
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

function getModelProviderConfigByProviderModelId(
  providerModelId: string,
  provider: ModelProviderName
): Result<ModelProviderConfig> {
  const providerModelIdKey = `${providerModelId}:${provider}`;

  let result = indexes.providerModelIdToConfig.get(providerModelIdKey);
  if (result) {
    return ok(result);
  }

  result = indexes.providerModelIdAliasToConfig.get(providerModelIdKey);
  if (result) {
    return ok(result);
  }

  return err(`Config not found for providerModelId: ${providerModelId}`);
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
  provider: ModelProviderName
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

function getModelProviderConfigByVersion(
  model: string,
  provider: ModelProviderName,
  version: string
): Result<ModelProviderConfig | null> {
  const currentEntry = getModelProviderEntry(model, provider);
  // if the given version matches the active config version (or both are undefined/empty)
  if (
    (!currentEntry.data?.config.version && !version) ||
    currentEntry.data?.config.version === version
  ) {
    return ok(currentEntry.data?.config ?? null);
  }

  const versionKey = `${model}:${provider}:${version}`;
  const archivedConfig = indexes.modelToArchivedEndpointConfigs.get(versionKey);

  return ok(archivedConfig || null);
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
  getModelProviderConfigByProviderModelId,
  getPtbEndpointsForProvider,
  getModelProviderConfigs,
  getModelProviders,
  getEndpointsByModel,
  getModelProviderEntriesByModel,
  getModelProviderEntry,
  getModelProviderConfigByVersion,
};
