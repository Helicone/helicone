/**
 * MiniMax metadata
 */

import type { AuthorMetadata } from "../../types";
import { minimaxModels } from "./index";

export const minimaxMetadata = {
  modelCount: Object.keys(minimaxModels).length,
  supported: true,
} satisfies AuthorMetadata;
