/**
 * Meta metadata
 */

import type { AuthorMetadata } from "../../types";
import { metaModels } from "./index";

export const metaMetadata = {
  modelCount: Object.keys(metaModels).length,
  supported: true,
} satisfies AuthorMetadata;
