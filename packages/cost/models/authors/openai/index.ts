/**
 * OpenAI model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as gpt4oModels } from "./gpt-4o/models";
import { models as o1Models } from "./o1/models";
import { models as o3Models } from "./o3/models";
import { models as o4Models } from "./o4/models";
import { models as gpt41Models } from "./gpt-4.1/models";
import { models as gpt5Models } from "./gpt-5/models";
import { models as gpt51Models } from "./gpt-5.1/models";
import { models as gpt52Models } from "./gpt-5.2/models";
import { models as ossModels } from "./oss/models";

// Import endpoints
import { endpoints as gpt4oEndpoints } from "./gpt-4o/endpoints";
import { endpoints as o1Endpoints } from "./o1/endpoints";
import { endpoints as o3Endpoints } from "./o3/endpoints";
import { endpoints as o4Endpoints } from "./o4/endpoints";
import { endpoints as gpt41Endpoints } from "./gpt-4.1/endpoints";
import { endpoints as gpt5Endpoints } from "./gpt-5/endpoints";
import { endpoints as gpt51Endpoints } from "./gpt-5.1/endpoints";
import { endpoints as gpt52Endpoints } from "./gpt-5.2/endpoints";
import { endpoints as ossEndpoints } from "./oss/endpoints";

// Aggregate models
export const openaiModels = {
  ...gpt4oModels,
  ...o1Models,
  ...o3Models,
  ...o4Models,
  ...gpt41Models,
  ...gpt5Models,
  ...gpt51Models,
  ...gpt52Models,
  ...ossModels,
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const openaiEndpointConfig = {
  ...gpt4oEndpoints,
  ...o1Endpoints,
  ...o3Endpoints,
  ...o4Endpoints,
  ...gpt41Endpoints,
  ...gpt5Endpoints,
  ...gpt51Endpoints,
  ...gpt52Endpoints,
  ...ossEndpoints,
} satisfies Record<string, ModelProviderConfig>;
