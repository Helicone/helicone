/**
 * Anthropic author metadata
 */

import { anthropicModels } from ".";
import type { AuthorMetadata } from "../../types";

export const anthropicMetadata = {
  name: "Anthropic",
  slug: "anthropic",
  description: "Creator of the Claude family of models",
  website: "https://www.anthropic.com",
  apiUrl: "https://api.anthropic.com",
  supported: true,
  modelCount: Object.keys(anthropicModels).length,
} satisfies AuthorMetadata;
