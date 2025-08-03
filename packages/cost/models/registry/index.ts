/**
 * Model registry index
 * Auto-generated on: 2025-07-31T22:29:33.278Z
 */

import type { ModelRegistry } from "../types";
import { baseModels } from "./base-models";

export const modelRegistry: ModelRegistry = {
  models: baseModels,
  variants: {}
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
    if ('providers' in model && model.providers) {
      Object.values(model.providers).forEach(impl => {
        acc[impl.provider] = (acc[impl.provider] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);
