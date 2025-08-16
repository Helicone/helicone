import type { Model } from "../../../types";

export const models = {
  // "gemini-1.5-pro": {
  //   name: "Google: Gemini 1.5 Pro",
  //   author: "google",
  //   description:
  //     "Mid-size multimodal model optimized for wide-range reasoning tasks. Can process large amounts of data: 2 hours of video, 19 hours of audio, codebases with 60,000 lines, or 2,000 pages of text. Note: Not available for new projects starting April 29, 2025.",
  //   contextLength: 2000000,
  //   maxOutputTokens: 8192,
  //   created: "2024-02-15T00:00:00.000Z",
  //   modality: "text+image->text",
  //   tokenizer: "Gemini",
  // },
  // "gemini-1.5-flash": {
  //   name: "Google: Gemini 1.5 Flash",
  //   author: "google",
  //   description:
  //     "Fast and efficient multimodal model for diverse tasks. Optimized for speed while maintaining strong performance across text, image, and code tasks. Note: Not available for new projects starting April 29, 2025.",
  //   contextLength: 1000000,
  //   maxOutputTokens: 8192,
  //   created: "2024-05-14T00:00:00.000Z",
  //   modality: "text+image->text",
  //   tokenizer: "Gemini",
  // },
  // "gemini-1.5-flash-8b": {
  //   name: "Google: Gemini 1.5 Flash 8B",
  //   author: "google",
  //   description:
  //     "Compact 8B parameter version of Gemini 1.5 Flash designed for high-volume, cost-sensitive applications while maintaining quality performance.",
  //   contextLength: 1000000,
  //   maxOutputTokens: 8192,
  //   created: "2024-05-14T00:00:00.000Z",
  //   modality: "text+image->text",
  //   tokenizer: "Gemini",
  // },
} satisfies Record<string, Model>;