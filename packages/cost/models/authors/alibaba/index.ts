/**
 * Alibaba model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as qwen25Models } from "./qwen2.5/models";
import { models as qwen3Models } from "./qwen3/models";
import { models as qwen38Models } from "./qwen3.8/models";

// Import endpoints
import { endpoints as qwen25Endpoints } from "./qwen2.5/endpoints";
import { endpoints as qwen3Endpoints } from "./qwen3/endpoints";
import { endpoints as qwen38Endpoints } from "./qwen3.8/endpoints";

// Aggregate models
export const alibabaModels = {
  ...qwen25Models,
  ...qwen3Models,
  ...qwen38Models,
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const alibabaEndpointConfig = {
  ...qwen25Endpoints,
  ...qwen3Endpoints,
  ...qwen38Endpoints,
} satisfies Record<string, ModelProviderConfig>;
