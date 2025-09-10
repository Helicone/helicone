/**
 * DeepSeek model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as r1Models } from "./r1/models";

// Import endpoints
import { endpoints as r1Endpoints } from "./r1/endpoints";

// Aggregate models
export const deepseekModels = {
  ...r1Models,
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const deepseekEndpointConfig = {
  ...r1Endpoints,
} satisfies Record<string, ModelProviderConfig>;
