/**
 * Qwen metadata
 */

import type { AuthorMetadata } from "../../types";
import { qwenModels } from "./index";

export const qwenMetadata = {
  modelCount: Object.keys(qwenModels).length,
  supported: true,
} satisfies AuthorMetadata;
