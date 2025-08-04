/**
 * Main entry point for the Helicone model cost system
 * 
 * Usage:
 * ```typescript
 * import { models } from "@helicone/cost/models";
 * 
 * // Get any model by ID (base or variant)
 * const gpt4 = models.get("gpt-4");
 * ```
 */

// Re-export all types
export type {
  Model,
  ModelVariant,
  ModelRegistry,
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
} from "./registry";

// Re-export the getModel utility
export { getModel } from "./utils";

// Convenience class for easier access
import { modelRegistry } from "./registry";
import { getModel as getModelUtil } from "./utils";

class ModelCatalog {
  private registry = modelRegistry;

  /**
   * Get any model by ID (base or variant)
   */
  get(modelId: string) {
    return getModelUtil(this.registry, modelId);
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
    let count = 0;
    for (const model of Object.values(this.registry.models)) {
      if (model.variants) {
        count += Object.keys(model.variants).length;
      }
    }
    return count;
  }
}

// Export a singleton instance
export const models = new ModelCatalog();

// Default export for convenience
export default models;