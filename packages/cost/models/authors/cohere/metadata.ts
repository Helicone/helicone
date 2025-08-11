/**
 * Cohere metadata
 */

import type { AuthorMetadata } from "../../types";

export const cohereMetadata = {
  modelCount: 8,
  supported: true,
  name: "Cohere",
  slug: "cohere",
  description: "Enterprise AI models for RAG, tool use, and multilingual applications",
  website: "https://cohere.com",
  apiUrl: "https://api.cohere.ai/v1",
} satisfies AuthorMetadata;
