/**
 * MoonshotAI metadata
 */

import type { AuthorMetadata } from "../../types";
import { moonshotaiModels } from "./models";

export const moonshotaiMetadata = {
  modelCount: Object.keys(moonshotaiModels).length,
  supported: true,
  pricingPages: ["https://platform.moonshot.cn/pricing"],
} satisfies AuthorMetadata;
