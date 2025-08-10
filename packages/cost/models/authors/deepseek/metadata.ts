/**
 * DeepSeek metadata
 */

import type { AuthorMetadata } from "../../types";
import { deepseekModels } from "./models";

export const deepseekMetadata = {
  modelCount: Object.keys(deepseekModels).length,
  supported: true,
} satisfies AuthorMetadata;
