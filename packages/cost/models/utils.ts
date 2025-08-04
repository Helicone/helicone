import type {
  Model,
  ModelVariant,
  ModelRegistry,
} from "./types";

/**
 * Resolve a variant by merging with its base model
 */
function resolveVariant(baseModel: Model, variant: ModelVariant): Model {
  
  // Merge base with variant overrides
  const mergedProviders = { ...baseModel.providers };
  
  // Merge variant providers with base providers (deep merge for each provider)
  if (variant.providers) {
    for (const [providerKey, variantProvider] of Object.entries(variant.providers)) {
      if (mergedProviders[providerKey] && variantProvider) {
        // Deep merge the provider implementation
        mergedProviders[providerKey] = {
          ...mergedProviders[providerKey],
          ...variantProvider,
          // Ensure cost is properly merged
          cost: {
            ...mergedProviders[providerKey].cost,
            ...(variantProvider.cost || {}),
          },
          // Ensure rateLimit is properly merged
          rateLimit: {
            ...(mergedProviders[providerKey].rateLimit || {}),
            ...(variantProvider.rateLimit || {}),
          },
        };
      } else if (variantProvider) {
        // If variant provider doesn't exist in base, we need to ensure it's complete
        // For now, we'll only add it if it has all required fields
        if (variantProvider.provider && variantProvider.available !== undefined && variantProvider.cost) {
          mergedProviders[providerKey] = variantProvider as any; // Type assertion needed here
        }
      }
    }
  }

  return {
    ...baseModel,
    id: variant.id,
    baseModelId: baseModel.id,
    metadata: { ...baseModel.metadata, ...variant.metadata },
    providers: mergedProviders,
  };
}

/**
 * Get any model by ID (base or variant)
 */
export function getModel(registry: ModelRegistry, modelId: string): Model | null {
  // Check base models first
  if (registry.models[modelId]) {
    return registry.models[modelId];
  }
  
  // Check nested variants in base models
  for (const baseModel of Object.values(registry.models)) {
    if (baseModel.variants && baseModel.variants[modelId]) {
      return resolveVariant(baseModel, baseModel.variants[modelId]);
    }
  }
  
  return null;
}