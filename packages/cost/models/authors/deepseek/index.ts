/**
 * DeepSeek model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as r1Models } from "./r1-distill/models";
import { models as v3Models } from "./deepseek-v3/model";
import { models as v4Models } from "./deepseek-v4/models";
import { models as reasonerModels } from "./deepseek-reasoner/model";

// Import endpoints
import { endpoints as r1Endpoints } from "./r1-distill/endpoints";
import { endpoints as v3Endpoints } from "./deepseek-v3/endpoints";
import { endpoints as v4Endpoints } from "./deepseek-v4/endpoints";
import { endpoints as reasonerEndpoints } from "./deepseek-reasoner/endpoints";

// Aggregate models
export const deepseekModels = {
  ...r1Models,
  ...v3Models,
  ...v4Models,
  ...reasonerModels,
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const deepseekEndpointConfig = {
  ...r1Endpoints,
  ...v3Endpoints,
  ...v4Endpoints,
  ...reasonerEndpoints,
} satisfies Record<string, ModelProviderConfig>;
