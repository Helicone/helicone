/**
 * MoonshotAI model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as kimiK2Models } from "./kimi-k2/models";
import { models as kimiK25Models } from "./kimi-k2.5/models";
import { models as kimiK3Models } from "./kimi-k3/models";

// Import endpoints
import { endpoints as kimiK2Endpoints } from "./kimi-k2/endpoints";
import { endpoints as kimiK25Endpoints } from "./kimi-k2.5/endpoints";
import { endpoints as kimiK3Endpoints } from "./kimi-k3/endpoints";

// Aggregate models
export const moonshotaiModels = {
  ...kimiK2Models,
  ...kimiK25Models,
  ...kimiK3Models,
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const moonshotaiEndpointConfig = {
  ...kimiK2Endpoints,
  ...kimiK25Endpoints,
  ...kimiK3Endpoints,
} satisfies Record<string, ModelProviderConfig>;
