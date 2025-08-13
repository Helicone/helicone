/**
 * Meta-Llama metadata
 */

import type { AuthorMetadata } from "../../types";
import { metaLlamaModels } from "./models";

export const metaLlamaMetadata = {
  modelCount: Object.keys(metaLlamaModels).length,
  supported: true,
} satisfies AuthorMetadata;
