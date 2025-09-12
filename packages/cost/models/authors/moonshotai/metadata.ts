/**
 * MoonshotAI metadata
 */

import type { AuthorMetadata } from "../../types";
import { moonshotaiModels } from "./index";

export const moonshotaiMetadata = {
  modelCount: Object.keys(moonshotaiModels).length,
  supported: true,
} satisfies AuthorMetadata;
