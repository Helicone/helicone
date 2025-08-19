/**
 * Google model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import { models as gemini25Models } from "./gemini-2.5/models";
import { endpoints as gemini25Endpoints } from "./gemini-2.5/endpoints";
import { ModelConfig, ModelProviderConfig } from "../../types";

export const googleModels = {
  ...gemini25Models,
} satisfies Record<string, ModelConfig>;

export const googleEndpointConfig = {
  ...gemini25Endpoints,
} satisfies Record<string, ModelProviderConfig>;
