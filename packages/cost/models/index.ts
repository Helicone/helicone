/**
 * Main entry point for the Helicone model cost system
 * 
 * Usage:
 * ```typescript
 * import { models } from "@helicone/cost/models";
 * 
 * // Get any model by ID (base or variant)
 * const gpt4 = models.get("gpt-4");
 * 
 * // Find models by criteria
 * const cheapModels = models.find({ maxCost: 0.001 });
 * 
 * // Get all models from a provider
 * const openrouterModels = models.byProvider("openrouter");
 * ```
 */

// Re-export all types
export type {
  BaseModel,
  ModelVariant,
  ModelRegistry,
  ResolvedModel,
  ModelCost,
  ProviderImplementation,
  ModelMetadata,
  ModelIndices,
  ModelLookupMap,
  ProviderSummary,
  ModelProviderCost,
} from "./types";

// Re-export constants and types
export { MODEL_CREATORS, PROVIDER_NAMES, type ModelCreator, type ProviderName } from "./constants";

// Re-export provider configurations
export { providerConfigs } from "./provider-configs";

// Re-export registry components
export { 
  modelRegistry,
  baseModels,
  modelCountByCreator,
  modelCountByProvider,
  variantsWithoutOverrides,
  type BaseModelId,
} from "./registry";

// Re-export all utilities
export {
  buildModelLookupMap,
  buildModelIndices,
  getModel,
  getProviderSummary,
  getModelProviders,
  findModels,
  resolveModelId,
  getModelVariants,
  getModelFamily,
} from "./utils";

// Re-export registry updater for programmatic updates
export { RegistryUpdater, registryUpdater } from "./registry-updater";

// Convenience class for easier access
import { modelRegistry } from "./registry";
import { 
  buildModelLookupMap, 
  buildModelIndices,
  getModel as getModelUtil,
  getProviderSummary as getProviderSummaryUtil,
  findModels as findModelsUtil,
} from "./utils";

class ModelCostSystem {
  private registry = modelRegistry;
  private lookupMap = buildModelLookupMap(this.registry);
  private indices = buildModelIndices(this.registry);

  /**
   * Get any model by ID (base or variant)
   */
  get(modelId: string) {
    return getModelUtil(this.registry, modelId);
  }

  /**
   * Find models by various criteria
   */
  find(query: Parameters<typeof findModelsUtil>[2]) {
    return findModelsUtil(this.registry, this.indices, query);
  }

  /**
   * Get all models from a specific provider
   */
  byProvider(provider: Parameters<typeof getProviderSummaryUtil>[2]) {
    return getProviderSummaryUtil(this.registry, this.indices, provider);
  }

  /**
   * Get total model count
   */
  get totalModels() {
    return Object.keys(this.lookupMap).length;
  }

  /**
   * Get base model count
   */
  get baseModels() {
    return Object.keys(this.registry.models).length;
  }

  /**
   * Get variant count
   */
  get variants() {
    return Object.keys(this.registry.variants).length;
  }
}

// Export a singleton instance
export const models = new ModelCostSystem();

// Default export for convenience
export default models;