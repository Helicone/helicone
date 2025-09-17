/**
 * Mistral model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as mistralNemoModels } from "./mistral-nemo/models";
import { models as mistralSmallModels } from "./mistral-small/models";

// Import endpoints
import { endpoints as mistralNemoEndpoints } from "./mistral-nemo/endpoints";
import { endpoints as mistralSmallEndpoints } from "./mistral-small/endpoints";

// Aggregate models
export const mistralModels = {
  ...mistralNemoModels,
  ...mistralSmallModels,
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const mistralEndpointConfig = {
  ...mistralNemoEndpoints,
  ...mistralSmallEndpoints,
} satisfies Record<string, ModelProviderConfig>;
