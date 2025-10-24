/**
 * Anthropic model registry aggregation
 * Combines all models and endpoints from subdirectories
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as claudeOpus41Models } from "./claude-opus-4-1/model";
import { models as claudeOpus4Models } from "./claude-opus-4/model";
import { models as claudeSonnet4Models } from "./claude-sonnet-4/model";
import { models as claude37SonnetModels } from "./claude-3.7-sonnet/model";
import { models as claude35SonnetV2Models } from "./claude-3.5-sonnet-v2/model";
import { models as claude35HaikuModels } from "./claude-3.5-haiku/model";
import { models as claude45SonnetModels } from "./claude-4.5-sonnet/model";
import { models as claude45HaikuModels } from "./claude-4.5-haiku/model";
import { models as claudeSonnet4520250929Models } from "./claude-sonnet-4-5-20250929/model";
import { models as claudeHaiku4520251001Models } from "./claude-haiku-4-5-20251001/model";
import { models as claudeOpus4120250805Models } from "./claude-opus-4-1-20250805/model";

// Import endpoints
import { endpoints as claudeOpus41Endpoints } from "./claude-opus-4-1/endpoints";
import { endpoints as claudeOpus4Endpoints } from "./claude-opus-4/endpoints";
import { endpoints as claudeSonnet4Endpoints } from "./claude-sonnet-4/endpoints";
import { endpoints as claude37SonnetEndpoints } from "./claude-3.7-sonnet/endpoints";
import { endpoints as claude35SonnetV2Endpoints } from "./claude-3.5-sonnet-v2/endpoints";
import { endpoints as claude35HaikuEndpoints } from "./claude-3.5-haiku/endpoints";
import { endpoints as claude45SonnetEndpoints } from "./claude-4.5-sonnet/endpoints";
import { endpoints as claude45HaikuEndpoints } from "./claude-4.5-haiku/endpoints";
import { endpoints as claudeSonnet4520250929Endpoints } from "./claude-sonnet-4-5-20250929/endpoints";
import { endpoints as claudeHaiku4520251001Endpoints } from "./claude-haiku-4-5-20251001/endpoints";
import { endpoints as claudeOpus4120250805Endpoints } from "./claude-opus-4-1-20250805/endpoints";

// Aggregate models
export const anthropicModels = {
  ...claudeOpus41Models,
  ...claudeOpus4Models,
  ...claudeSonnet4Models,
  ...claude37SonnetModels,
  ...claude35SonnetV2Models,
  ...claude35HaikuModels,
  ...claude45SonnetModels,
  ...claude45HaikuModels,
  ...claudeSonnet4520250929Models,
  ...claudeHaiku4520251001Models,
  ...claudeOpus4120250805Models,
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const anthropicEndpointConfig = {
  ...claudeOpus41Endpoints,
  ...claudeOpus4Endpoints,
  ...claudeSonnet4Endpoints,
  ...claude37SonnetEndpoints,
  ...claude35SonnetV2Endpoints,
  ...claude35HaikuEndpoints,
  ...claude45SonnetEndpoints,
  ...claude45HaikuEndpoints,
  ...claudeSonnet4520250929Endpoints,
  ...claudeHaiku4520251001Endpoints,
  ...claudeOpus4120250805Endpoints,
} satisfies Record<string, ModelProviderConfig>;
