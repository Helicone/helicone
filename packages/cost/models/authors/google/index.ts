/**
 * Google model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { Model, Endpoint, EndpointKey } from "../../types";

// Import models
import { models as gemini25Models } from "./gemini-2.5/models";
import { models as gemini20Models } from "./gemini-2.0/models";
import { models as gemini15Models } from "./gemini-1.5/models";

// Import endpoints
import { endpoints as gemini25Endpoints } from "./gemini-2.5/endpoints";
import { endpoints as gemini20Endpoints } from "./gemini-2.0/endpoints";
import { endpoints as gemini15Endpoints } from "./gemini-1.5/endpoints";

// Aggregate models
export const googleModels = {
  ...gemini25Models,
  ...gemini20Models,
  ...gemini15Models,
} satisfies Record<string, Model>;

// Aggregate endpoints
export const googleEndpoints = {
  ...gemini25Endpoints,
  ...gemini20Endpoints,
  ...gemini15Endpoints,
} satisfies Record<EndpointKey<GoogleModelName>, Endpoint>;

// Export types
export type GoogleModelName = keyof typeof googleModels;
export type GoogleEndpointId = keyof typeof googleEndpoints;

// Re-export metadata
export { googleMetadata } from "./metadata";