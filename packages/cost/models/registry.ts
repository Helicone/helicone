/**
 * Main registry with O(1) endpoint access
 */

import type {
  Endpoint,
  ModelConfig,
  ModelProviderConfig,
  UserEndpointConfig,
} from "./types";
import { buildIndexes } from "./build-indexes";
import { buildEndpointUrl, buildModelId, type ProviderName } from "./providers";
import { Result, ok, err } from "../../common/result";

// Import all models and endpoints from authors
import { anthropicModels, anthropicEndpointConfig } from "./authors/anthropic";
import { openaiModels, openaiEndpointConfig } from "./authors/openai";

// Combine all models FIRST (so ModelName is available)
const allModels = {
  ...anthropicModels,
  ...openaiModels,
} satisfies Record<string, ModelConfig>;

export type ModelName = keyof typeof allModels;

// NOW we can use ModelName in the type
const modelProviderConfigs = {
  ...anthropicEndpointConfig,
  ...openaiEndpointConfig,
} satisfies Record<string, ModelProviderConfig>;

export type ModelProviderConfigId = keyof typeof modelProviderConfigs;

// Extract all deployment names
export type DeploymentName = {
  [K in ModelProviderConfigId]: (typeof modelProviderConfigs)[K] extends {
    endpointConfigs: infer D;
  }
    ? D extends Record<string, any>
      ? keyof D & string
      : never
    : never;
}[ModelProviderConfigId];

export type EndpointId = `${ModelName}:${ProviderName}:${DeploymentName}`;

// Build indexes at module load time
const indexes = buildIndexes(modelProviderConfigs);

export class ModelRegistry {
  getModel(modelId: string): Result<ModelConfig> {
    const model = allModels[modelId as ModelName];
    return model ? ok(model) : err(`Model not found: ${modelId}`);
  }

  getAllModels(): Result<ModelConfig[]> {
    return ok(Object.values(allModels));
  }

  getAllModelIds(): Result<ModelName[]> {
    return ok(Object.keys(allModels) as ModelName[]);
  }

  getAllModelsWithIds(): Result<Record<ModelName, ModelConfig>> {
    return ok(allModels);
  }

  getPtbEndpointById(
    model: string,
    provider: string,
    endpointConfigId: string = "*"
  ): Result<Endpoint> {
    const endpointId = `${model}:${provider}:${endpointConfigId}`;
    const endpoint = indexes.endpointIdToEndpoint.get(endpointId as EndpointId);
    return endpoint ? ok(endpoint) : err(`Endpoint not found: ${endpointId}`);
  }

  getPtbEndpoints(
    model: string, // Model name (gpt-4o, claude-3-5-haiku, etc)
    provider?: string, // Provider name (openai, anthropic, etc)
    endpointConfigId?: string // Deployment/region name (us-east-1, etc)
  ): Result<Endpoint[]> {
    // Case 1: Model + Provider + EndpointConfigId - return specific endpoint as array
    if (provider && endpointConfigId) {
      const result = this.getPtbEndpointById(model, provider, endpointConfigId);
      return result.error ? result : ok([result.data!]);
    }

    // Case 2: Model + Provider - return all endpoints for that provider
    if (provider) {
      return this.getPtbEndpointsByProvider(model, provider);
    }

    // Case 3: Model only - return all PTB endpoints
    return this.getPtbEndpointsByModel(model);
  }

  getPtbEndpointsByModel(model: string): Result<Endpoint[]> {
    const endpoints = indexes.modelToPtbEndpoints.get(model as ModelName) || [];
    return ok(endpoints);
  }

  getPtbEndpointsByProvider(
    model: string,
    provider: string
  ): Result<Endpoint[]> {
    const configId = `${model}:${provider}` as ModelProviderConfigId;
    const endpoints = indexes.modelProviderIdToPtbEndpoints.get(configId) || [];
    return ok(endpoints);
  }

  getProviderModels(provider: string): Result<Set<ModelName>> {
    const models =
      indexes.providerToModels.get(provider as ProviderName) || new Set();
    return ok(models);
  }

  buildUrl(
    endpointConfig: ModelProviderConfig,
    userConfig?: UserEndpointConfig
  ): Result<string> {
    return buildEndpointUrl(endpointConfig, userConfig);
  }

  buildModelId(
    endpointConfig: ModelProviderConfig,
    userConfig?: UserEndpointConfig
  ): Result<string> {
    return buildModelId(endpointConfig, userConfig);
  }

  getModelProviderConfig(
    model: string,
    provider: string
  ): Result<ModelProviderConfig> {
    const configId = `${model}:${provider}` as ModelProviderConfigId;
    const config = indexes.endpointConfigIdToEndpointConfig.get(configId);
    return config ? ok(config) : err(`Config not found: ${configId}`);
  }

  getModelProviderConfigs(model: string): Result<ModelProviderConfig[]> {
    const configs =
      indexes.modelToEndpointConfigs.get(model as ModelName) || [];
    return ok(configs);
  }

  getModelProviders(model: string): Result<Set<ProviderName>> {
    const providers =
      indexes.modelToProviders.get(model as ModelName) || new Set();
    return ok(providers);
  }
}

export const registry = new ModelRegistry();

export const {
  getModel,
  getAllModels,
  getAllModelIds,
  getAllModelsWithIds,
  getPtbEndpoints,
  getPtbEndpointById,
  getPtbEndpointsByModel,
  getPtbEndpointsByProvider,
  getProviderModels,
  getModelProviderConfig,
  getModelProviderConfigs,
} = registry;
