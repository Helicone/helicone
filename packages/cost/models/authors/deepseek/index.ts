/**
 * DeepSeek model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as r1Models } from "./r1-distill/models";
import { models as v3Models } from "./deepseek-v3/model";
import { models as reasonerModels } from "./deepseek-reasoner/model";

// Import endpoints
import { endpoints as r1Endpoints } from "./r1-distill/endpoints";
import { endpoints as v3Endpoints } from "./deepseek-v3/endpoints";
import { endpoints as reasonerEndpoints } from "./deepseek-reasoner/endpoints";

// Aggregate models
export const deepseekModels = {
  ...r1Models,
  ...v3Models,
  ...reasonerModels,
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const deepseekEndpointConfig = {
  ...r1Endpoints,
  ...v3Endpoints,
  ...reasonerEndpoints,
} satisfies Record<string, ModelProviderConfig>;
