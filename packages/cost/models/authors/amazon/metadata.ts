/**
 * Amazon metadata
 */

import type { AuthorMetadata } from "../../types";
import { amazonModels } from "./models";

export const amazonMetadata = {
  modelCount: Object.keys(amazonModels).length,
  supported: true,
} satisfies AuthorMetadata;
