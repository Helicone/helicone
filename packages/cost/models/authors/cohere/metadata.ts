/**
 * Cohere metadata
 */

import type { AuthorMetadata } from "../../types";
import { cohereModels } from "./models";

export const cohereMetadata = {
  modelCount: Object.keys(cohereModels).length,
  supported: true,
} satisfies AuthorMetadata;
