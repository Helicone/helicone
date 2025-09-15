/**
 * Alibaba model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as qwenModels } from "./qwen/models";

// Import endpoints
import { endpoints as qwenEndpoints } from "./qwen/endpoints";

// Aggregate models
export const alibabaModels = {
  ...qwenModels,
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const alibabaEndpointConfig = {
  ...qwenEndpoints,
} satisfies Record<string, ModelProviderConfig>;
