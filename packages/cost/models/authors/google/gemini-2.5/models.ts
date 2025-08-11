import type { Model } from "../../../types";

export const models = {
  // "gemini-2.5-pro": {
  //   name: "Google: Gemini 2.5 Pro",
  //   author: "google",
  //   description:
  //     "Google's most advanced reasoning model capable of solving complex problems in code, math, and STEM. Features adaptive thinking capabilities and can analyze large datasets, codebases, and documents using long context. Optimized for complex reasoning tasks.",
  //   contextLength: 2000000,
  //   maxOutputTokens: 32768,
  //   created: "2025-04-09T00:00:00.000Z",
  //   modality: "text+image->text",
  //   tokenizer: "Gemini",
  // },
  // "gemini-2.5-flash": {
  //   name: "Google: Gemini 2.5 Flash",
  //   author: "google",
  //   description:
  //     "Best model for price-performance with well-rounded capabilities. Features thinking capabilities and is optimized for large-scale processing, low-latency, high-volume tasks. Ideal for agentic use cases.",
  //   contextLength: 1000000,
  //   maxOutputTokens: 32768,
  //   created: "2025-04-17T00:00:00.000Z",
  //   modality: "text+image->text",
  //   tokenizer: "Gemini",
  // },
  // "gemini-2.5-flash-lite": {
  //   name: "Google: Gemini 2.5 Flash Lite",
  //   author: "google",
  //   description:
  //     "Fast, low-cost, high-performance model in the Gemini 2.5 series. Optimized for speed and efficiency while maintaining quality performance.",
  //   contextLength: 1000000,
  //   maxOutputTokens: 32768,
  //   created: "2025-06-17T00:00:00.000Z",
  //   modality: "text+image->text",
  //   tokenizer: "Gemini",
  // },
} satisfies Record<string, Model>;