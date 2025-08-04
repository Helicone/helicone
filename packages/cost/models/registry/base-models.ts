/**
 * Base model definitions
 * Auto-generated on: 2025-08-04T04:52:42.851Z
 */

import type { BaseModel } from "../types";

import { anthropicModels } from "./anthropic";
import { googleModels } from "./google";
import { metaModels } from "./meta";
import { mistralModels } from "./mistral";
import { openaiModels } from "./openai";
import { xaiModels } from "./xai";

export const baseModels = {
  ...anthropicModels,
  ...googleModels,
  ...metaModels,
  ...mistralModels,
  ...openaiModels,
  ...xaiModels,
} satisfies Record<string, BaseModel>;

export type BaseModelId = keyof typeof baseModels;
