/**
 * Google model definitions
 */

import type { Model } from "../../types";

/**
 * Google model names as const array
 */
export const googleModelNames = [
  "gemini-2.5-pro",
  "gemini-2.5-flash", 
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
] as const;

export type GoogleModelName = (typeof googleModelNames)[number];

export const googleModels = {
  "gemini-2.5-pro": {
    name: "Google: Gemini 2.5 Pro",
    author: "google",
    description:
      "Google's most advanced reasoning model capable of solving complex problems in code, math, and STEM. Features adaptive thinking capabilities and can analyze large datasets, codebases, and documents using long context. Optimized for complex reasoning tasks.",
    contextLength: 2000000,
    maxOutputTokens: 32768,
    created: "2025-04-09T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Gemini",
  },
  
  "gemini-2.5-flash": {
    name: "Google: Gemini 2.5 Flash",
    author: "google",
    description:
      "Best model for price-performance with well-rounded capabilities. Features thinking capabilities and is optimized for large-scale processing, low-latency, high-volume tasks. Ideal for agentic use cases.",
    contextLength: 1000000,
    maxOutputTokens: 32768,
    created: "2025-04-17T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Gemini",
  },

  "gemini-2.5-flash-lite": {
    name: "Google: Gemini 2.5 Flash Lite",
    author: "google", 
    description:
      "Fast, low-cost, high-performance model in the Gemini 2.5 series. Optimized for speed and efficiency while maintaining quality performance.",
    contextLength: 1000000,
    maxOutputTokens: 32768,
    created: "2025-06-17T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Gemini",
  },

  "gemini-2.0-flash": {
    name: "Google: Gemini 2.0 Flash",
    author: "google",
    description:
      "Next-generation model with superior speed, native tool use, and 1M token context window. Delivers improved capabilities including conversational image generation and editing.",
    contextLength: 1000000,
    maxOutputTokens: 32768,
    created: "2024-12-11T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Gemini",
  },

  "gemini-2.0-flash-lite": {
    name: "Google: Gemini 2.0 Flash Lite",
    author: "google",
    description:
      "Lightweight version of Gemini 2.0 Flash optimized for speed and cost-efficiency while maintaining core capabilities.",
    contextLength: 1000000,
    maxOutputTokens: 32768,
    created: "2024-12-11T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Gemini",
  },

  "gemini-1.5-pro": {
    name: "Google: Gemini 1.5 Pro",
    author: "google",
    description:
      "Mid-size multimodal model optimized for wide-range reasoning tasks. Can process large amounts of data: 2 hours of video, 19 hours of audio, codebases with 60,000 lines, or 2,000 pages of text. Note: Not available for new projects starting April 29, 2025.",
    contextLength: 2000000,
    maxOutputTokens: 8192,
    created: "2024-02-15T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Gemini",
  },

  "gemini-1.5-flash": {
    name: "Google: Gemini 1.5 Flash",
    author: "google",
    description:
      "Fast and efficient multimodal model for diverse tasks. Optimized for speed while maintaining strong performance across text, image, and code tasks. Note: Not available for new projects starting April 29, 2025.",
    contextLength: 1000000,
    maxOutputTokens: 8192,
    created: "2024-05-14T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Gemini",
  },

  "gemini-1.5-flash-8b": {
    name: "Google: Gemini 1.5 Flash 8B",
    author: "google",
    description:
      "Compact 8B parameter version of Gemini 1.5 Flash designed for high-volume, cost-sensitive applications while maintaining quality performance.",
    contextLength: 1000000,
    maxOutputTokens: 8192,
    created: "2024-05-14T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Gemini",
  },
} satisfies Record<GoogleModelName, Model>;