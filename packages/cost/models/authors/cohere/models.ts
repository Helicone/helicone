/**
 * Cohere model definitions
 */

import type { Model } from "../../types";

/**
 * Cohere model names as const array
 */
export const cohereModelNames = [
  "command-a-03-2025",
  "command-r-plus",
  "command-r",
  "command-light",
  "c4ai-aya-expanse-32b",
  "c4ai-aya-expanse-8b",
  "embed-english-v3.0",
  "embed-multilingual-v3.0",
] as const;

export type CohereModelName = (typeof cohereModelNames)[number];

export const cohereModels = {
  "command-a-03-2025": {
    name: "Cohere: Command A",
    author: "cohere",
    description:
      "Cohere's latest flagship model with 256k context length and 8k output tokens. Optimized for enterprise applications with advanced reasoning and text generation capabilities.",
    contextLength: 262144,
    maxOutputTokens: 8192,
    created: "2025-03-01T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "Cohere",
  },

  "command-r-plus": {
    name: "Cohere: Command R+",
    author: "cohere",
    description:
      "Optimized for conversational interaction and long-context tasks. Best suited for complex RAG workflows and multi-step tool use. Features 128k context length with advanced multilingual capabilities.",
    contextLength: 131072,
    maxOutputTokens: 4096,
    created: "2024-08-01T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "Cohere",
  },

  "command-r": {
    name: "Cohere: Command R",
    author: "cohere",
    description:
      "Great for simpler retrieval augmented generation (RAG) and single-step tool use tasks. Optimized for applications where cost is a major consideration while maintaining strong performance.",
    contextLength: 131072,
    maxOutputTokens: 4096,
    created: "2024-03-01T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "Cohere",
  },

  "command-light": {
    name: "Cohere: Command Light",
    author: "cohere",
    description:
      "Smaller, faster variant of the Command model with 4k context length. Legacy model - Cohere recommends using newer R and R+ models for new applications.",
    contextLength: 4096,
    maxOutputTokens: 4096,
    created: "2023-06-01T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "Cohere",
  },

  "c4ai-aya-expanse-32b": {
    name: "Cohere: Aya Expanse 32B",
    author: "cohere",
    description:
      "Large multilingual model supporting 23+ languages with 32B parameters. Designed for diverse multilingual applications and cross-lingual understanding.",
    contextLength: 8192,
    maxOutputTokens: 4096,
    created: "2024-10-01T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "Cohere",
  },

  "c4ai-aya-expanse-8b": {
    name: "Cohere: Aya Expanse 8B",
    author: "cohere",
    description:
      "Compact multilingual model supporting 23+ languages with 8B parameters. Cost-effective option for multilingual applications with good performance.",
    contextLength: 8192,
    maxOutputTokens: 4096,
    created: "2024-10-01T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "Cohere",
  },

  "embed-english-v3.0": {
    name: "Cohere: Embed English v3.0",
    author: "cohere",
    description:
      "High-quality embeddings for English text, supporting up to 512 tokens with 1,024 dimensions. Designed for semantic similarity measurements using cosine similarity.",
    contextLength: 512,
    maxOutputTokens: 1024,
    created: "2024-01-01T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "Cohere",
  },

  "embed-multilingual-v3.0": {
    name: "Cohere: Embed Multilingual v3.0",
    author: "cohere",
    description:
      "Multilingual embedding model supporting multiple languages with 1,024 dimensions for up to 512 tokens. Ideal for cross-lingual similarity and retrieval tasks.",
    contextLength: 512,
    maxOutputTokens: 1024,
    created: "2024-01-01T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "Cohere",
  },
} satisfies Record<CohereModelName, Model>;