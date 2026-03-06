import { ModelConfig } from "../../../types";

export const model = {
  "gemini-3.1-flash-lite-preview": {
    name: "Google Gemini 3.1 Flash-Lite Preview",
    author: "google",
    description:
      "Gemini 3.1 Flash-Lite Preview is Google's most cost-efficient model, optimized for high-volume agentic tasks, translation, and simple data processing. Supports thinking/chain-of-thought reasoning, caching, function calling, structured outputs, search grounding, and code execution. Preview model with more restrictive rate limits.",
    contextLength: 1_048_576,
    maxOutputTokens: 65_536,
    created: "2026-03-01T00:00:00",
    modality: { inputs: ["text", "image", "audio", "video"], outputs: ["text"] },
    tokenizer: "Gemini",
  },
} satisfies Record<string, ModelConfig>;

export type Gemini31FlashLitePreviewModelName = keyof typeof model;
