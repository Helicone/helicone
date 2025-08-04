/**
 * Model registry index
 * Auto-generated on: 2025-07-31T22:29:33.278Z
 */

import type { ModelRegistry } from "../types";
import { baseModels } from "./base-models";

export const modelRegistry: ModelRegistry = {
  models: baseModels,
};

// Re-export for convenience
export { baseModels } from "./base-models";

// Empty for now since we have no standalone variants
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