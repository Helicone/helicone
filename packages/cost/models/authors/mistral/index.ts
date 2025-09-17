/**
 * Mistral model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as mistralNemoModels } from "./mistral-nemo/models";

// Import endpoints
import { endpoints as mistralNemoEndpoints } from "./mistral-nemo/endpoints";

// Aggregate models
export const mistralModels = {
  ...mistralNemoModels,
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const mistralEndpointConfig = {
  ...mistralNemoEndpoints,
} satisfies Record<string, ModelProviderConfig>;
