/**
 * Model registry index
 * Auto-generated on: 2025-07-31T22:29:33.278Z
 */

import type { ModelRegistry, ModelVariant } from "../types";
import { baseModels } from "./base-models";

// Build variants object from nested variants in base models for backward compatibility
function buildVariantsFromBaseModels(): Record<string, ModelVariant> {
  const variants: Record<string, ModelVariant> = {};
  
  for (const [baseModelId, baseModel] of Object.entries(baseModels)) {
    // Check if baseModel has variants property and it's defined
    if ('variants' in baseModel && baseModel.variants) {
      for (const [variantId, variant] of Object.entries(baseModel.variants)) {
        // Add baseModelId to variant for backward compatibility
        variants[variantId] = {
          ...variant,
          baseModelId,
        };
      }
    }
  }
  
  return variants;
}

export const modelRegistry: ModelRegistry = {
  models: baseModels,
  variants: buildVariantsFromBaseModels()
};

// Re-export for convenience
export { baseModels, type BaseModelId } from "./base-models";

// Empty for now since we have no variants
export const variantsWithoutOverrides = [] as string[];

// Calculate statistics dynamically
export const modelCountByCreator = Object.values(baseModels).reduce((acc, model) => {
  acc[model.creator] = (acc[model.creator] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

export const modelCountByProvider = Object.values(baseModels)
  .reduce((acc, model) => {
    // All models should have providers, but check just in case
    if (model.providers) {
      Object.values(model.providers).forEach(impl => {
        acc[impl.provider] = (acc[impl.provider] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);
