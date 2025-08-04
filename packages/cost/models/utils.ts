import type {
  BaseModel,
  ModelVariant,
  ModelRegistry,
  ResolvedModel,
} from "./types";

/**
 * Resolve a variant by merging with its base model
 */
function resolveVariant(registry: ModelRegistry, variant: ModelVariant, baseModelId?: string): ResolvedModel | null {
  // Use provided baseModelId or get it from variant (for backward compatibility)
  const resolvedBaseModelId = baseModelId || variant.baseModelId;
  
  if (!resolvedBaseModelId) {
    console.warn(`No base model ID found for variant: ${variant.id}`);
    return null;
  }
  
  const baseModel = registry.models[resolvedBaseModelId];
  if (!baseModel) {
    console.warn(`Base model not found: ${resolvedBaseModelId} for variant: ${variant.id}`);
    return null;
  }
  
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
    baseModelId: resolvedBaseModelId,
    metadata: { ...baseModel.metadata, ...variant.metadata },
    providers: mergedProviders,
  };
}

/**
 * Get any model by ID (base or variant)
 */
export function getModel(registry: ModelRegistry, modelId: string): ResolvedModel | null {
  // Check base models first
  if (registry.models[modelId]) {
    return registry.models[modelId];
  }
  
  // Check nested variants in base models
  for (const [baseModelId, baseModel] of Object.entries(registry.models)) {
    if ('variants' in baseModel && baseModel.variants && baseModel.variants[modelId]) {
      return resolveVariant(registry, baseModel.variants[modelId], baseModelId);
    }
  }
  
  // Check variants in registry (for backward compatibility)
  if (registry.variants[modelId]) {
    return resolveVariant(registry, registry.variants[modelId]);
  }
  
  return null;
}