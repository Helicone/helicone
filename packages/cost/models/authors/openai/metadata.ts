/**
 * OpenAI metadata
 */

import type { AuthorMetadata } from "../../types";
import { openaiModels } from "./index";

export const openaiMetadata = {
  modelCount: Object.keys(openaiModels).length,
  supported: true,
} satisfies AuthorMetadata;
