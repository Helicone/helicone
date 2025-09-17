/**
 * Type definitions for the model registry
 * Separated to avoid circular dependencies
 */

import type { ModelProviderName } from "./providers";

// Import configs to derive types
import { anthropicEndpointConfig } from "./authors/anthropic";
import { openaiEndpointConfig } from "./authors/openai";
import { googleEndpointConfig } from "./authors/google";
import { grokEndpointConfig } from "./authors/xai";
import { anthropicModels } from "./authors/anthropic";
import { openaiModels } from "./authors/openai";
import { googleModels } from "./authors/google";
import { grokModels } from "./authors/xai";
import { mistralEndpointConfig, mistralModels } from "./authors/mistralai";

// Combine all models for type derivation
const allModels = {
  ...anthropicModels,
  ...openaiModels,
  ...googleModels,
  ...grokModels,
  ...mistralModels
};

export type ModelName = keyof typeof allModels;

// Combine configs for type derivation
const modelProviderConfigs = {
  ...anthropicEndpointConfig,
  ...openaiEndpointConfig,
  ...googleEndpointConfig,
  ...grokEndpointConfig,
  ...mistralEndpointConfig
};

export type ModelProviderConfigId = keyof typeof modelProviderConfigs;

// Extract all deployment names
export type DeploymentName = {
  [K in ModelProviderConfigId]: (typeof modelProviderConfigs)[K] extends {
    endpointConfigs: infer D;
  }
    ? D extends Record<string, any>
      ? keyof D & string
      : never
    : never;
}[ModelProviderConfigId];

export type EndpointId = `${ModelName}:${ModelProviderName}:${DeploymentName}`;
