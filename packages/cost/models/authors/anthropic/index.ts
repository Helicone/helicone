/**
 * Anthropic model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { Model, Endpoint, EndpointKey } from "../../types";

// Import models
import { models as claudeOpus41Models } from "./claude-opus-4-1/model";
import { models as claudeOpus4Models } from "./claude-opus-4/model";
import { models as claudeSonnet4Models } from "./claude-sonnet-4/model";
import { models as claude37SonnetModels } from "./claude-3.7-sonnet/model";
import { models as claude35SonnetV2Models } from "./claude-3.5-sonnet-v2/model";
import { models as claude35HaikuModels } from "./claude-3.5-haiku/model";

// Import endpoints
import { endpoints as claudeOpus41Endpoints } from "./claude-opus-4-1/endpoints";
import { endpoints as claudeOpus4Endpoints } from "./claude-opus-4/endpoints";
import { endpoints as claudeSonnet4Endpoints } from "./claude-sonnet-4/endpoints";
import { endpoints as claude37SonnetEndpoints } from "./claude-3.7-sonnet/endpoints";
import { endpoints as claude35SonnetV2Endpoints } from "./claude-3.5-sonnet-v2/endpoints";
import { endpoints as claude35HaikuEndpoints } from "./claude-3.5-haiku/endpoints";

// Aggregate models
export const anthropicModels = {
  ...claudeOpus41Models,
  ...claudeOpus4Models,
  ...claudeSonnet4Models,
  ...claude37SonnetModels,
  ...claude35SonnetV2Models,
  ...claude35HaikuModels,
} satisfies Record<string, Model>;

// Aggregate endpoints
export const anthropicEndpoints = {
  ...claudeOpus41Endpoints,
  ...claudeOpus4Endpoints,
  ...claudeSonnet4Endpoints,
  ...claude37SonnetEndpoints,
  ...claude35SonnetV2Endpoints,
  ...claude35HaikuEndpoints,
} satisfies Record<EndpointKey<AnthropicModelName>, Endpoint>;

// Export types
export type AnthropicModelName = keyof typeof anthropicModels;
export type AnthropicEndpointId = keyof typeof anthropicEndpoints;

// Re-export metadata
export { anthropicMetadata } from "./metadata";
