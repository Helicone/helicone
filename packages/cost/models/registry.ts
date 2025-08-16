/**
 * Main registry with O(1) endpoint access
 */

import type {
  Endpoint,
  EndpointId,
  Model,
  ModelIndexes,
  ModelName,
  ProviderName,
} from "./types";
import { buildIndexes } from "./build-indexes";
import { buildEndpointUrl, buildModelId } from "./providers";
import type { UserConfig } from "./types";
import { Result, ok, err } from "../../common/result";

// Import all models and endpoints from authors
import { anthropicModels, anthropicEndpoints } from "./authors/anthropic";
import { openaiModels, openaiEndpoints } from "./authors/openai";
import { perplexityModels, perplexityEndpoints } from "./authors/perplexity";
import { xAiModels, xAiEndpoints } from "./authors/x-ai";
import { amazonModels, amazonEndpoints } from "./authors/amazon";
import { cohereModels, cohereEndpoints } from "./authors/cohere";
import { deepseekModels, deepseekEndpoints } from "./authors/deepseek";
import { googleModels, googleEndpoints } from "./authors/google";
import { groqModels, groqEndpoints } from "./authors/groq";
import { metaLlamaModels, metaLlamaEndpoints } from "./authors/meta-llama";
import { mistralaiModels, mistralaiEndpoints } from "./authors/mistralai";
import { moonshotaiModels, moonshotaiEndpoints } from "./authors/moonshotai";
import { nvidiaModels, nvidiaEndpoints } from "./authors/nvidia";

// Combine all endpoints
const allEndpoints: Record<EndpointId, Endpoint> = {
  ...anthropicEndpoints,
  ...openaiEndpoints,
  ...perplexityEndpoints,
  ...xAiEndpoints,
  ...amazonEndpoints,
  ...cohereEndpoints,
  ...deepseekEndpoints,
  ...googleEndpoints,
  ...groqEndpoints,
  ...metaLlamaEndpoints,
  ...mistralaiEndpoints,
  ...moonshotaiEndpoints,
  ...nvidiaEndpoints,
};

// Combine all models
const allModels: Record<ModelName, Model> = {
  ...anthropicModels,
  ...openaiModels,
  ...perplexityModels,
  ...xAiModels,
  ...amazonModels,
  ...cohereModels,
  ...deepseekModels,
  ...googleModels,
  ...groqModels,
  ...metaLlamaModels,
  ...mistralaiModels,
  ...moonshotaiModels,
  ...nvidiaModels,
};

// Build indexes at module load time
const indexes: ModelIndexes = buildIndexes(allEndpoints);

export class ModelRegistry {
  getModel(modelId: string): Result<Model> {
    const model = allModels[modelId as ModelName];
    return model ? ok(model) : err(`Model not found: ${modelId}`);
  }

  getAllModels(): Result<Model[]> {
    return ok(Object.values(allModels));
  }

  getAllModelIds(): Result<string[]> {
    return ok(Object.keys(allModels));
  }

  getAllModelsWithIds(): Result<Record<string, Model>> {
    return ok(allModels);
  }

  /**
   * Get endpoint by model, provider, and optional region
   */
  getEndpoint(
    model: string, // ModelName
    provider: string, // ProviderName
    region?: string
  ): Result<Endpoint> {
    // Try exact match with region
    if (region) {
      const exactId = `${model}:${provider}:${region}` as EndpointId;
      const exact = allEndpoints[exactId];
      if (exact) return ok(exact);
    }

    // Fall back to provider without region
    const providerId = `${model}:${provider}` as EndpointId;
    const providerEndpoint = allEndpoints[providerId];
    if (providerEndpoint) return ok(providerEndpoint);

    // Fall back to searching through model+provider endpoints
    const endpoints = indexes.byModelProvider.get(
      `${model as ModelName}:${provider as ProviderName}`
    );

    return endpoints?.[0]
      ? ok(endpoints[0])
      : err(
          `Endpoint not found: ${model}:${provider}${region ? `:${region}` : ""}`
        );
  }

  createFallbackEndpoint(modelName: string, provider: ProviderName): Endpoint {
    return {
      providerModelId: modelName,
      modelId: modelName as ModelName,
      ptbEnabled: false,
      provider,
      pricing: {
        prompt: 0,
        completion: 0,
      },
      contextLength: 0,
      maxCompletionTokens: 0,
      supportedParameters: [],
    };
  }

  /**
   * Get all endpoints for a model (sorted by cost, cheapest first)
   */
  getModelEndpoints(model: string): Result<Endpoint[]> {
    const endpoints = indexes.byModel.get(model as ModelName) || [];
    return ok(endpoints); // Always return success with empty array if not found
  }

  /**
   * Get PTB-enabled endpoints for a model (sorted by cost, cheapest first)
   */
  getPtbEndpoints(model: string): Result<Endpoint[]> {
    const endpoints = indexes.byModelPtb.get(model as ModelName) || [];
    return ok(endpoints); // Always return success with empty array if not found
  }

  /**
   * Get BYOK endpoints for a model filtered by user's available providers
   */
  getByokEndpoints(model: string, userProviders: string[]): Result<Endpoint[]> {
    const endpointsResult = this.getModelEndpoints(model);
    if (endpointsResult.error || !endpointsResult.data) return endpointsResult;

    const providerSet = new Set(userProviders as ProviderName[]);
    const filtered = endpointsResult.data.filter((e: Endpoint) =>
      providerSet.has(e.provider)
    );
    return ok(filtered);
  }

  getProviderModels(provider: string): Result<ModelName[]> {
    const models = indexes.providerToModels.get(provider as ProviderName) || [];
    return ok(models); // Always return success with empty array if not found
  }

  buildUrl(endpoint: Endpoint, userConfig?: UserConfig): Result<string> {
    return buildEndpointUrl(endpoint, userConfig);
  }

  buildModelId(endpoint: Endpoint, userConfig?: UserConfig): Result<string> {
    return buildModelId(endpoint, userConfig);
  }

  hasPtbSupport(model: string): Result<boolean> {
    const hasSupport = indexes.byModelPtb.has(model as ModelName);
    return ok(hasSupport);
  }
}

// Export singleton instance
export const registry = new ModelRegistry();

// Export convenience functions
export const {
  getModel,
  getAllModels,
  getAllModelIds,
  getAllModelsWithIds,
  getEndpoint,
  createFallbackEndpoint,
  getModelEndpoints,
  getPtbEndpoints,
  getByokEndpoints,
  getProviderModels,
  hasPtbSupport,
} = registry;
