/**
 * Zai model registry aggregation
 * Combines all models and endpoints from Zai
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models and endpoints
import { models as glm4Models } from "./glm-4/models";
import { endpoints as glm4Endpoints } from "./glm-4/endpoints";

// Aggregate models
export const zaiModels = {
  ...glm4Models
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const zaiEndpointConfig = {
  ...glm4Endpoints
} satisfies Record<string, ModelProviderConfig>;
