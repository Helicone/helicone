/**
 * MistralAI metadata
 */

import type { AuthorMetadata } from "../../types";
import { mistralaiModels } from "./models";

export const mistralaiMetadata = {
  modelCount: Object.keys(mistralaiModels).length,
  supported: true,
} satisfies AuthorMetadata;
