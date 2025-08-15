/**
 * X-AI model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { Model, Endpoint } from "../../types";

// Import models
import { models as grok4Models } from "./grok-4/models";
import { models as grok3Models } from "./grok-3/models";
import { models as grok2Models } from "./grok-2/models";

// Import endpoints
import { endpoints as grok4Endpoints } from "./grok-4/endpoints";
import { endpoints as grok3Endpoints } from "./grok-3/endpoints";
import { endpoints as grok2Endpoints } from "./grok-2/endpoints";

// Aggregate models
export const xAiModels = {
  ...grok4Models,
  ...grok3Models,
  ...grok2Models,
} satisfies Record<string, Model>;

// Aggregate endpoints
export const xAiEndpoints = {
  ...grok4Endpoints,
  ...grok3Endpoints,
  ...grok2Endpoints,
} satisfies Record<string, ModelProviderConfig>;

// Export types
export type XAIModelName = keyof typeof xAiModels;
export type XAIEndpointId = keyof typeof xAiEndpoints;

// Re-export metadata
export { xAiMetadata } from "./metadata";