/**
 * Qwen model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as qwen3Models } from "./qwen3/models";

// Import endpoints
import { endpoints as qwen3Endpoints } from "./qwen3/endpoints";

// Aggregate models
export const qwenModels = {
  ...qwen3Models,
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const qwenEndpointConfig = {
  ...qwen3Endpoints,
} satisfies Record<string, ModelProviderConfig>;
