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

export class ModelRegistry {
  getModel(modelId: ModelName): Model | undefined {
    return allModels[modelId];
  }

  getAllModels(): Model[] {
    return Object.values(allModels);
  }

  /**
   * Get endpoint by model, provider, and optional region
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
   * Get all endpoints for a model (sorted by cost, cheapest first)
   */
  getModelEndpoints(model: ModelName): Endpoint[] {
    return indexes.byModel.get(model) || [];
  }

  /**
   * Get PTB-enabled endpoints for a model (sorted by cost, cheapest first)
   */
  getPtbEndpoints(model: ModelName): Endpoint[] {
    return indexes.byModelPtb.get(model) || [];
  }

  /**
   * Get BYOK endpoints for a model filtered by user's available providers
   */
  getByokEndpoints(
    model: ModelName,
    userProviders: ProviderName[]
  ): Endpoint[] {
    const allEndpoints = this.getModelEndpoints(model);
    const providerSet = new Set(userProviders);
    return allEndpoints.filter((e) => providerSet.has(e.provider));
  }

  getProviderModels(provider: ProviderName): ModelName[] {
    return indexes.providerToModels.get(provider) || [];
  }

  buildUrl(endpoint: Endpoint, userConfig?: UserConfig): string {
    return buildEndpointUrl(endpoint, userConfig);
  }

  buildModelId(endpoint: Endpoint, userConfig?: UserConfig): string {
    return buildModelId(endpoint, userConfig);
  }

  hasPtbSupport(model: ModelName): boolean {
    return indexes.byModelPtb.has(model);
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
} = registry;
