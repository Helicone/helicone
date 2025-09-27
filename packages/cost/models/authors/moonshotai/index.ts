/**
 * MoonshotAI model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as kimiK2Models } from "./kimi-k2/models";

// Import endpoints
import { endpoints as kimiK2Endpoints } from "./kimi-k2/endpoints";

// Aggregate models
export const moonshotaiModels = {
  ...kimiK2Models,
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const moonshotaiEndpointConfig = {
  ...kimiK2Endpoints,
} satisfies Record<string, ModelProviderConfig>;
