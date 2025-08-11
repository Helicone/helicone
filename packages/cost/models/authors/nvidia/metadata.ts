/**
 * Nvidia metadata
 */

import type { AuthorMetadata } from "../../types";
import { nvidiaModels } from "./models";

export const nvidiaMetadata = {
  modelCount: Object.keys(nvidiaModels).length,
  supported: false,
  pricingPages: ["https://build.nvidia.com/explore"],
} satisfies AuthorMetadata;
