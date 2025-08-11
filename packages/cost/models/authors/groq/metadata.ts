/**
 * Groq provider metadata
 */

import type { AuthorMetadata } from "../../types";

export const groqMetadata = {
  modelCount: 9,
  supported: true,
  name: "Groq",
  slug: "groq", 
  description: "Ultra-fast AI inference with Language Processing Units (LPUs)",
  website: "https://groq.com",
  apiUrl: "https://api.groq.com/openai/v1",
} satisfies AuthorMetadata;