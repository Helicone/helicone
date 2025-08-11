/**
 * Build-time index generation
 * Creates O(1) lookup maps from flat endpoint arrays
 */

import type { ModelName, ProviderName, ModelIndexes, Endpoint } from "./types";

export function buildIndexes(
  endpoints: Record<string, Endpoint>
): ModelIndexes {
  const byModel = new Map<ModelName, Endpoint[]>();
  const byModelPtb = new Map<ModelName, Endpoint[]>();
  const byModelProvider = new Map<`${ModelName}:${ProviderName}`, Endpoint[]>();
  const byId = new Map<string, Endpoint>();
  const providerToModels = new Map<ProviderName, ModelName[]>();

  // Single pass through all endpoints
  for (const [id, endpoint] of Object.entries(endpoints)) {
    // Index by ID
    byId.set(id, endpoint);

    // Index by model
    if (!byModel.has(endpoint.modelId)) {
      byModel.set(endpoint.modelId, []);
    }
    byModel.get(endpoint.modelId)!.push(endpoint);

    // Index PTB-enabled endpoints
    if (endpoint.ptbEnabled) {
      if (!byModelPtb.has(endpoint.modelId)) {
        byModelPtb.set(endpoint.modelId, []);
      }
      byModelPtb.get(endpoint.modelId)!.push(endpoint);
    }

    // Index by model + provider
    const modelProviderKey =
      `${endpoint.modelId}:${endpoint.provider}` as `${ModelName}:${ProviderName}`;
    if (!byModelProvider.has(modelProviderKey)) {
      byModelProvider.set(modelProviderKey, []);
    }
    byModelProvider.get(modelProviderKey)!.push(endpoint);

    // Track provider -> models (with deduplication)
    if (!providerToModels.has(endpoint.provider)) {
      providerToModels.set(endpoint.provider, []);
    }
    const models = providerToModels.get(endpoint.provider)!;
    if (!models.includes(endpoint.modelId)) {
      models.push(endpoint.modelId);
    }
  }

  // Sort all arrays by cost (cheapest first)
  const sortByCost = (a: Endpoint, b: Endpoint) => {
    const aCost = a.pricing.prompt + a.pricing.completion;
    const bCost = b.pricing.prompt + b.pricing.completion;
    return aCost - bCost;
  };

  // Sort each model's endpoints by cost
  byModel.forEach((endpoints) => {
    endpoints.sort(sortByCost);
  });

  // Sort PTB endpoints by cost
  byModelPtb.forEach((endpoints) => {
    endpoints.sort(sortByCost);
  });

  // Sort model+provider endpoints by cost
  byModelProvider.forEach((endpoints) => {
    endpoints.sort(sortByCost);
  });

  return {
    byModel,
    byModelPtb,
    byModelProvider,
    byId,
    providerToModels,
  };
}
