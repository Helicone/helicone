/**
 * OpenAI metadata
 */

import type { AuthorMetadata } from "../../types";
import { openaiModels } from "./models";

export const openaiMetadata = {
  modelCount: Object.keys(openaiModels).length,
  supported: true,
  pricingPages: [
    "https://openai.com/api/pricing",
    "https://platform.openai.com/docs/models",
  ],
} satisfies AuthorMetadata;
