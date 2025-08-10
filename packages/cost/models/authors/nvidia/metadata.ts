/**
 * Nvidia metadata
 */

import type { AuthorMetadata } from "../../types";
import { nvidiaModels } from "./models";

export const nvidiaMetadata = {
  modelCount: Object.keys(nvidiaModels).length,
  supported: false,
} satisfies AuthorMetadata;
