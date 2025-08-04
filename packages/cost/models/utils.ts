import type {
  BaseModel,
  ModelVariant,
  ModelRegistry,
  ModelIndices,
  ProviderName,
  ModelCreator,
  ProviderSummary,
  ModelProviderCost,
  ResolvedModel,
  ModelLookupMap,
} from "./types";

// Cache for fast lookups
let modelLookupMap: ModelLookupMap | null = null;

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
 * Build lookup map for O(1) access to any model
 */
export function buildModelLookupMap(registry: ModelRegistry): ModelLookupMap {
  const lookupMap: ModelLookupMap = {};
  
  // Add all base models
  for (const [id, model] of Object.entries(registry.models)) {
    lookupMap[id] = {
      type: 'model',
      data: model,
    };
    
    // Add nested variants from base models
    if ('variants' in model && model.variants) {
      for (const [variantId, variant] of Object.entries(model.variants)) {
        const resolved = resolveVariant(registry, variant, id);
        if (resolved) {
          lookupMap[variantId] = {
            type: 'variant',
            data: resolved,
          };
        }
      }
    }
  }
  
  // Add all variants from registry (for backward compatibility)
  for (const [id, variant] of Object.entries(registry.variants)) {
    // Skip if already added from nested variants
    if (!lookupMap[id]) {
      const resolved = resolveVariant(registry, variant);
      if (resolved) {
        lookupMap[id] = {
          type: 'variant',
          data: resolved,
        };
      }
    }
  }
  
  modelLookupMap = lookupMap;
  return lookupMap;
}

/**
 * Get any model by ID with O(1) lookup
 */
export function getModel(registry: ModelRegistry, modelId: string): ResolvedModel | null {
  // Use cache if available
  if (modelLookupMap) {
    return modelLookupMap[modelId]?.data || null;
  }
  
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

/**
 * Build indices from a model registry for efficient lookups
 */
export function buildModelIndices(registry: ModelRegistry): ModelIndices {
  const byProvider = new Map<ProviderName, Set<string>>();
  const byCreator = new Map<ModelCreator, Set<string>>();
  const byAlias = new Map<string, string>();

  // Build lookup map first
  const lookupMap = buildModelLookupMap(registry);
  
  // Index all models (base + resolved variants)
  for (const [modelId, entry] of Object.entries(lookupMap)) {
    const model = entry.data;
    
    // Index by creator
    if (!byCreator.has(model.creator)) {
      byCreator.set(model.creator, new Set());
    }
    byCreator.get(model.creator)!.add(modelId);

    // Index by provider
    for (const [providerKey, impl] of Object.entries(model.providers)) {
      if (impl.available) {
        if (!byProvider.has(impl.provider)) {
          byProvider.set(impl.provider, new Set());
        }
        byProvider.get(impl.provider)!.add(modelId);
      }
    }

    // Add common aliases
    if (model.metadata.displayName) {
      byAlias.set(model.metadata.displayName.toLowerCase(), modelId);
    }
  }

  return {
    byProvider,
    byCreator,
    byAlias,
  };
}

/**
 * Get all models available from a specific provider
 * Use case: Provider page showing all their models
 */
export function getProviderSummary(
  registry: ModelRegistry,
  indices: ModelIndices,
  provider: ProviderName
): ProviderSummary | null {
  const modelIds = indices.byProvider.get(provider);
  if (!modelIds) return null;

  const models = Array.from(modelIds)
    .map(modelId => {
      const model = getModel(registry, modelId);
      if (!model) return null;
      
      const providerImpl = Object.values(model.providers).find(
        p => p.provider === provider && p.available
      );
      
      if (!providerImpl) return null;
      
      return {
        modelId,
        creator: model.creator,
        displayName: model.metadata.displayName,
        cost: providerImpl.cost,
        available: providerImpl.available,
        contextWindow: model.metadata.contextWindow,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  return {
    provider,
    modelCount: models.length,
    models,
  };
}

/**
 * Get all providers that offer a specific model
 * Use case: Model page showing all available providers
 */
export function getModelProviders(
  registry: ModelRegistry,
  modelId: string
): ModelProviderCost | null {
  const model = getModel(registry, modelId);
  if (!model) return null;

  const providers = Object.entries(model.providers)
    .filter(([_, impl]) => impl.available)
    .map(([_, impl]) => ({
      provider: impl.provider,
      cost: impl.cost,
      available: impl.available,
      endpoint: impl.endpoint,
    }))
    .sort((a, b) => {
      // Sort by cheapest prompt cost first
      const costA = a.cost.prompt_token;
      const costB = b.cost.prompt_token;
      return costA - costB;
    });

  return {
    modelId,
    displayName: model.metadata.displayName,
    creator: model.creator,
    providers,
  };
}

/**
 * Find models by various criteria
 */
export function findModels(
  registry: ModelRegistry,
  indices: ModelIndices,
  query: {
    provider?: ProviderName;
    creator?: ModelCreator;
    minContextWindow?: number;
    searchTerm?: string;
  }
): ResolvedModel[] {
  // Get all model IDs from the lookup map
  let modelIds = new Set(indices.byAlias.values());
  
  // Also add all models from indices
  indices.byCreator.forEach(ids => ids.forEach(id => modelIds.add(id)));

  // Filter by provider
  if (query.provider) {
    const providerModels = indices.byProvider.get(query.provider);
    if (!providerModels) return [];
    modelIds = new Set(
      Array.from(modelIds).filter(id => providerModels.has(id))
    );
  }

  // Filter by creator
  if (query.creator) {
    const creatorModels = indices.byCreator.get(query.creator);
    if (!creatorModels) return [];
    modelIds = new Set(
      Array.from(modelIds).filter(id => creatorModels.has(id))
    );
  }

  // Convert to models and apply remaining filters
  return Array.from(modelIds)
    .map(id => getModel(registry, id))
    .filter((model): model is ResolvedModel => {
      if (!model) return false;
      
      if (query.minContextWindow && 
          model.metadata.contextWindow < query.minContextWindow) {
        return false;
      }
      
      if (query.searchTerm) {
        const term = query.searchTerm.toLowerCase();
        return (
          model.id.toLowerCase().includes(term) ||
          model.metadata.displayName.toLowerCase().includes(term) ||
          model.metadata.description.toLowerCase().includes(term)
        );
      }
      
      return true;
    })
    .sort((a, b) => a.metadata.displayName.localeCompare(b.metadata.displayName));
}

/**
 * Resolve a model identifier (could be ID or alias) to canonical model ID
 */
export function resolveModelId(
  indices: ModelIndices,
  identifier: string
): string | null {
  // Check if it's already a valid model ID
  if (indices.byAlias.has(identifier)) {
    return indices.byAlias.get(identifier)!;
  }
  
  // Check lowercase version
  const lowerIdentifier = identifier.toLowerCase();
  if (indices.byAlias.has(lowerIdentifier)) {
    return indices.byAlias.get(lowerIdentifier)!;
  }
  
  // Assume it's a direct model ID
  return identifier;
}

/**
 * Get all variants of a base model
 */
export function getModelVariants(
  registry: ModelRegistry,
  baseModelId: string
): ModelVariant[] {
  const variants: ModelVariant[] = [];
  
  // Get nested variants from base model
  const baseModel = registry.models[baseModelId];
  if (baseModel && 'variants' in baseModel && baseModel.variants) {
    variants.push(...Object.values(baseModel.variants));
  }
  
  // Get variants from registry (for backward compatibility)
  const registryVariants = Object.values(registry.variants).filter(
    variant => variant.baseModelId === baseModelId
  );
  
  // Merge and deduplicate by ID
  const allVariants = [...variants, ...registryVariants];
  const uniqueVariants = allVariants.reduce((acc, variant) => {
    if (!acc.find(v => v.id === variant.id)) {
      acc.push(variant);
    }
    return acc;
  }, [] as ModelVariant[]);
  
  return uniqueVariants;
}

/**
 * Get model family (base + all variants)
 */
export function getModelFamily(
  registry: ModelRegistry,
  modelId: string
): { base: BaseModel; variants: ModelVariant[] } | null {
  // Check if it's a base model
  if (registry.models[modelId]) {
    return {
      base: registry.models[modelId],
      variants: getModelVariants(registry, modelId),
    };
  }
  
  // Check if it's a nested variant in base models
  for (const [baseModelId, baseModel] of Object.entries(registry.models)) {
    if ('variants' in baseModel && baseModel.variants && baseModel.variants[modelId]) {
      return {
        base: baseModel,
        variants: getModelVariants(registry, baseModelId),
      };
    }
  }
  
  // Check if it's a variant in registry (for backward compatibility)
  const variant = registry.variants[modelId];
  if (variant && variant.baseModelId && registry.models[variant.baseModelId]) {
    return {
      base: registry.models[variant.baseModelId],
      variants: getModelVariants(registry, variant.baseModelId),
    };
  }
  
  return null;
}