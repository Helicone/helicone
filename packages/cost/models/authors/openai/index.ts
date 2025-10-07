/**
 * OpenAI model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as gpt4oModels } from "./gpt-4o/models";
import { models as o3Models } from "./o3/models";
import { models as o4Models } from "./o4/models";
import { models as gpt41Models } from "./gpt-4.1/models";
import { models as gpt5Models } from "./gpt-5/models";
import { models as ossModels } from "./oss/models";
import { models as gptImage1Models } from "./gpt-image-1/models";

// Import endpoints
import { endpoints as gpt4oEndpoints } from "./gpt-4o/endpoints";
import { endpoints as o3Endpoints } from "./o3/endpoints";
import { endpoints as o4Endpoints } from "./o4/endpoints";
import { endpoints as gpt41Endpoints } from "./gpt-4.1/endpoints";
import { endpoints as gpt5Endpoints } from "./gpt-5/endpoints";
import { endpoints as ossEndpoints } from "./oss/endpoints";
import { endpoints as gptImage1Endpoints } from "./gpt-image-1/endpoints";

// Aggregate models
export const openaiModels = {
  ...gpt4oModels,
  ...o3Models,
  ...o4Models,
  ...gpt41Models,
  ...gpt5Models,
  ...ossModels,
  ...gptImage1Models,
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const openaiEndpointConfig = {
  ...gpt4oEndpoints,
  ...o3Endpoints,
  ...o4Endpoints,
  ...gpt41Endpoints,
  ...gpt5Endpoints,
  ...ossEndpoints,
  ...gptImage1Endpoints,
} satisfies Record<string, ModelProviderConfig>;
