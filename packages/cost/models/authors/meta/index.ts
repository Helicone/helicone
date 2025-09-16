/**
 * Meta model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as llamaModels } from "./llama/models";

// Import endpoints
import { endpoints as llamaEndpoints } from "./llama/endpoints";

// Aggregate models
export const metaModels = {
  ...llamaModels,
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const metaEndpointConfig = {
  ...llamaEndpoints,
} satisfies Record<string, ModelProviderConfig>;
