/**
 * Anthropic author metadata
 */

import type { AuthorMetadata } from "../../types";
import { anthropicModels } from "./models";

export const anthropicMetadata = {
  name: "Anthropic",
  slug: "anthropic",
  description: "Creator of the Claude family of models",
  website: "https://www.anthropic.com",
  apiUrl: "https://api.anthropic.com",
  supported: true,
  modelCount: Object.keys(anthropicModels).length,
  pricingPages: [
    "https://docs.anthropic.com/en/docs/build-with-claude/pricing",
    "https://www.anthropic.com/pricing",
  ],
} satisfies AuthorMetadata;
