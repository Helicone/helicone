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

/**
 * Main Registry class with O(1) lookups
 */
export class ModelRegistry {
  // ============= Model Access =============

  /**
   * Get model metadata
   * O(1) lookup
   */
  getModel(modelId: ModelName): Model | undefined {
    return allModels[modelId];
  }

  /**
   * Get all models
   */
  getAllModels(): Model[] {
    return Object.values(allModels);
  }

  // ============= Endpoint Access =============

  /**
   * Get endpoint by model, provider, and optional region
   * O(1) lookup
   */
  getEndpoint(
    model: ModelName,
    provider: ProviderName,
    region?: string
  ): Endpoint | undefined {
    // Try exact match with region
    if (region) {
      const exactId = `${model}:${provider}:${region}` as EndpointId;
      const exact = allEndpoints[exactId];
      if (exact) return exact;
    }

    // Fall back to provider without region
    const providerId = `${model}:${provider}` as EndpointId;
    const providerEndpoint = allEndpoints[providerId];
    if (providerEndpoint) return providerEndpoint;

    // Fall back to searching through model+provider endpoints
    const endpoints = indexes.byModelProvider.get(`${model}:${provider}`);
    return endpoints?.[0];
  }

  /**
   * Get all endpoints for a model
   * O(1) lookup
   */
  getModelEndpoints(model: ModelName): Endpoint[] {
    return indexes.byModel.get(model) || [];
  }

  /**
   * Get PTB-enabled endpoints for a model
   * O(1) lookup
   */
  getPtbEndpoints(model: ModelName): Endpoint[] {
    return indexes.byModelPtb.get(model) || [];
  }

  /**
   * Get BYOK endpoints for a model filtered by user's available providers
   * O(1) lookups
   */
  getByokEndpoints(
    model: ModelName,
    userProviders: ProviderName[]
  ): Endpoint[] {
    const allEndpoints = this.getModelEndpoints(model);
    const providerSet = new Set(userProviders);
    return allEndpoints.filter((e) => providerSet.has(e.provider));
  }

  /**
   * Get all models available from a provider
   * O(1) lookup
   */
  getProviderModels(provider: ProviderName): ModelName[] {
    return indexes.providerToModels.get(provider) || [];
  }

  // ============= URL Building =============

  /**
   * Build URL for an endpoint with user configuration
   */
  buildUrl(endpoint: Endpoint, userConfig?: UserConfig): string {
    return buildEndpointUrl(endpoint, userConfig);
  }

  /**
   * Build model ID for an endpoint with user configuration
   */
  buildModelId(endpoint: Endpoint, userConfig?: UserConfig): string {
    return buildModelId(endpoint, userConfig);
  }

  // ============= Utility Functions =============

  /**
   * Check if a model has PTB support
   * O(1) lookup
   */
  hasPtbSupport(model: ModelName): boolean {
    return indexes.byModelPtb.has(model);
  }

  /**
   * Get cheapest endpoint for a model (useful for PTB)
   * O(n) where n is number of endpoints for the model
   */
  getCheapestEndpoint(
    model: ModelName,
    ptbOnly: boolean = false
  ): Endpoint | undefined {
    const endpoints = ptbOnly
      ? this.getPtbEndpoints(model)
      : this.getModelEndpoints(model);

    if (endpoints.length === 0) return undefined;

    return endpoints.reduce((cheapest, current) => {
      const cheapestCost =
        cheapest.pricing.prompt + cheapest.pricing.completion;
      const currentCost = current.pricing.prompt + current.pricing.completion;
      return currentCost < cheapestCost ? current : cheapest;
    });
  }

  /**
   * Get endpoints sorted by price
   */
  getEndpointsByPrice(model: ModelName, ascending: boolean = true): Endpoint[] {
    const endpoints = this.getModelEndpoints(model);
    return endpoints.sort((a, b) => {
      const aCost = a.pricing.prompt + a.pricing.completion;
      const bCost = b.pricing.prompt + b.pricing.completion;
      return ascending ? aCost - bCost : bCost - aCost;
    });
  }
}

// Export singleton instance
export const registry = new ModelRegistry();

// Export convenience functions
export const {
  getModel,
  getAllModels,
  getEndpoint,
  getModelEndpoints,
  getPtbEndpoints,
  getByokEndpoints,
  getProviderModels,
  hasPtbSupport,
  getCheapestEndpoint,
} = registry;
