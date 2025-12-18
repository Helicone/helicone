import { ModelConfig } from "../../../types";

export const model = {
  "gemini-3-flash-preview": {
    name: "Google Gemini 3 Flash Preview",
    author: "google",
    description:
      "Gemini 3 Flash Preview is Google's latest fast and efficient AI model optimized for quick response times while maintaining high quality. This preview version offers excellent performance for everyday tasks including text generation, code assistance, and multimodal understanding at a lower cost than Pro variants.",
    contextLength: 1_048_576,
    maxOutputTokens: 65_536,
    created: "2025-12-17T00:00:00",
    modality: { inputs: ["text", "image", "audio", "video"], outputs: ["text"] },
    tokenizer: "Gemini",
  },
} satisfies Record<string, ModelConfig>;

export type Gemini3FlashPreviewModelName = keyof typeof model;
