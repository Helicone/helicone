/**
 * MoonshotAI model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as kimiK2Models } from "./kimi-k2/models";
import { models as kimiK25Models } from "./kimi-k2.5/models";

// Import endpoints
import { endpoints as kimiK2Endpoints } from "./kimi-k2/endpoints";
import { endpoints as kimiK25Endpoints } from "./kimi-k2.5/endpoints";

// Aggregate models
export const moonshotaiModels = {
  ...kimiK2Models,
  ...kimiK25Models,
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const moonshotaiEndpointConfig = {
  ...kimiK2Endpoints,
  ...kimiK25Endpoints,
} satisfies Record<string, ModelProviderConfig>;
