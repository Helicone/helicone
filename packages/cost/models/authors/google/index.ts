/**
 * Google model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import { model as gemini25ProModel } from "./gemini-2.5-pro/model";
import { endpoints as gemini25ProEndpoints } from "./gemini-2.5-pro/endpoints";
import { model as gemini25FlashModel } from "./gemini-2.5-flash/model";
import { endpoints as gemini25FlashEndpoints } from "./gemini-2.5-flash/endpoints";
import { model as gemini25FlashLiteModel } from "./gemini-2.5-flash-lite/model";
import { endpoints as gemini25FlashLiteEndpoints } from "./gemini-2.5-flash-lite/endpoints";
import { model as gemma29bModel } from "./gemma/model";
import { endpoints as gemma29bEndpoints } from "./gemma/endpoints";
import { model as gemma3Model } from "./gemma-3/model";
import { endpoints as gemma3Endpoints } from "./gemma-3/endpoints";
import { ModelConfig, ModelProviderConfig } from "../../types";

export const googleModels = {
  ...gemini25ProModel,
  ...gemini25FlashModel,
  ...gemini25FlashLiteModel,
  ...gemma29bModel,
  ...gemma3Model,
} satisfies Record<string, ModelConfig>;

export const googleEndpointConfig = {
  ...gemini25ProEndpoints,
  ...gemini25FlashEndpoints,
  ...gemini25FlashLiteEndpoints,
  ...gemma29bEndpoints,
  ...gemma3Endpoints,
} satisfies Record<string, ModelProviderConfig>;
