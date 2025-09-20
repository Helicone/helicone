/**
 * Type definitions for the model registry
 * Separated to avoid circular dependencies
 */

import type { ModelProviderName } from "./providers";

// Import configs to derive types
import { anthropicEndpointConfig, anthropicModels } from "./authors/anthropic";
import { deepseekEndpointConfig, deepseekModels } from "./authors/deepseek";
import { googleEndpointConfig, googleModels } from "./authors/google";
import { grokEndpointConfig, grokModels } from "./authors/xai";
import { openaiEndpointConfig, openaiModels } from "./authors/openai";
import { mistralEndpointConfig, mistralModels } from "./authors/mistralai";

// Combine all models for type derivation
const allModels = {
  ...anthropicModels,
  ...openaiModels,
  ...googleModels,
  ...grokModels,
  ...mistralModels,
  ...deepseekModels
};

export type ModelName = keyof typeof allModels;

// Combine configs for type derivation
const modelProviderConfigs = {
  ...anthropicEndpointConfig,
  ...openaiEndpointConfig,
  ...googleEndpointConfig,
  ...grokEndpointConfig,
  ...mistralEndpointConfig,
  ...deepseekEndpointConfig
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
