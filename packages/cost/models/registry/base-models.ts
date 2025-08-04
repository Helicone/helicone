/**
 * Base model definitions
 * Auto-generated on: 2025-08-04T02:18:27.177Z
 * Combines all creator-specific model files
 */

import type { BaseModel } from "../types";

// Import all creator-specific models
import { openaiModels } from "./openai";
import { anthropicModels } from "./anthropic";
import { googleModels } from "./google";
import { metaModels } from "./meta";
import { xaiModels } from "./xai";
import { mistralModels } from "./mistral";

// Combine all models
export const baseModels = {
  ...openaiModels,
  ...anthropicModels,
  ...googleModels,
  ...metaModels,
  ...xaiModels,
  ...mistralModels,
} satisfies Record<string, BaseModel>;

export type BaseModelId = keyof typeof baseModels;
