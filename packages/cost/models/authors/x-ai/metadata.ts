/**
 * X-AI metadata
 */

import type { AuthorMetadata } from "../../types";
import { xAiModels } from "./models";

export const xAiMetadata = {
  modelCount: Object.keys(xAiModels).length,
  supported: true,
} satisfies AuthorMetadata;
