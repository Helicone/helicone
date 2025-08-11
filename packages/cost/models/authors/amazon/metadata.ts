/**
 * Amazon metadata
 */

import type { AuthorMetadata } from "../../types";
import { amazonModels } from "./models";

export const amazonMetadata = {
  modelCount: Object.keys(amazonModels).length,
  supported: true,
  pricingPages: [
    "https://aws.amazon.com/bedrock/pricing/",
    "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
  ],
} satisfies AuthorMetadata;
