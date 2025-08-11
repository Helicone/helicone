/**
 * X-AI metadata
 */

import type { AuthorMetadata } from "../../types";
import { xAiModels } from "./models";

export const xAiMetadata = {
  modelCount: Object.keys(xAiModels).length,
  supported: true,
  pricingPages: [
    "https://docs.x.ai/docs/pricing",
    "https://docs.x.ai/docs/models",
  ],
} satisfies AuthorMetadata;
