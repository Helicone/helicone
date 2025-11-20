/**
 * Mistral metadata
 */

import type { AuthorMetadata } from "../../types";
import { mistralModels } from "./index";

export const mistralMetadata = {
  modelCount: Object.keys(mistralModels).length,
  supported: true,
} satisfies AuthorMetadata;
