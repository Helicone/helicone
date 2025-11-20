/**
 * Meta model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as llamaModels } from "./llama/models";
import { models as hermesModels } from "./hermes/models";

// Import endpoints
import { endpoints as llamaEndpoints } from "./llama/endpoints";
import { endpoints as hermesEndpoints } from "./hermes/endpoints";

// Aggregate models
export const metaModels = {
  ...llamaModels,
  ...hermesModels,
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const metaEndpointConfig = {
  ...llamaEndpoints,
  ...hermesEndpoints,
} satisfies Record<string, ModelProviderConfig>;
