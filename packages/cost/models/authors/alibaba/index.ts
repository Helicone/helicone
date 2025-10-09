/**
 * Alibaba model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as qwen25Models } from "./qwen2.5/models";
import { models as qwen3Models } from "./qwen3/models";

// Import endpoints
import { endpoints as qwen25Endpoints } from "./qwen2.5/endpoints";
import { endpoints as qwen3Endpoints } from "./qwen3/endpoints";

// Aggregate models
export const alibabaModels = {
  ...qwen25Models,
  ...qwen3Models,
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const alibabaEndpointConfig = {
  ...qwen25Endpoints,
  ...qwen3Endpoints,
} satisfies Record<string, ModelProviderConfig>;
