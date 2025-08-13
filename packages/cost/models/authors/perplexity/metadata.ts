/**
 * Perplexity metadata
 */

import type { AuthorMetadata } from "../../types";
import { perplexityModels } from "./models";

export const perplexityMetadata = {
  modelCount: Object.keys(perplexityModels).length,
  supported: true,
} satisfies AuthorMetadata;
