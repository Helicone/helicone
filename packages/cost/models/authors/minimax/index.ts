/**
 * MiniMax model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as m27Models } from "./minimax-m2.7/model";
import { models as m25Models } from "./minimax-m2.5/model";

// Import endpoints
import { endpoints as m27Endpoints } from "./minimax-m2.7/endpoints";
import { endpoints as m25Endpoints } from "./minimax-m2.5/endpoints";

// Aggregate models
export const minimaxModels = {
  ...m27Models,
  ...m25Models,
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const minimaxEndpointConfig = {
  ...m27Endpoints,
  ...m25Endpoints,
} satisfies Record<string, ModelProviderConfig>;
