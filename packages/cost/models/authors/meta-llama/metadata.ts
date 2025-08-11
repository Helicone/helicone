/**
 * Meta-Llama metadata
 */

import type { AuthorMetadata } from "../../types";
import { metaLlamaModels } from "./models";

export const metaLlamaMetadata = {
  modelCount: Object.keys(metaLlamaModels).length,
  supported: true,
  pricingPages: [
    "https://www.llama.com/",
    "https://aws.amazon.com/bedrock/pricing/",
    "https://console.groq.com/pricing",
  ],
} satisfies AuthorMetadata;
