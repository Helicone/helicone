/**
 * Baidu model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as ernieModels } from "./ernie/models";

// Import endpoints
import { endpoints as ernieEndpoints } from "./ernie/endpoints";

// Aggregate models
export const baiduModels = {
  ...ernieModels
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const baiduEndpointConfig = {
  ...ernieEndpoints
} satisfies Record<string, ModelProviderConfig>;
