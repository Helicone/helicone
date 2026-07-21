import { ModelConfig } from "../../../types";

export const model = {
  "gemini-3.1-flash-lite": {
    name: "Google Gemini 3.1 Flash-Lite",
    author: "google",
    description:
      "Gemini 3.1 Flash-Lite is Google's most cost-efficient model, optimized for high-volume agentic tasks, translation, and simple data processing. Supports thinking/chain-of-thought reasoning, caching, function calling, structured outputs, search grounding, and code execution.",
    contextLength: 1_048_576,
    maxOutputTokens: 65_536,
    created: "2026-05-07T00:00:00",
    modality: { inputs: ["text", "image", "audio", "video"], outputs: ["text"] },
    tokenizer: "Gemini",
  },
} satisfies Record<string, ModelConfig>;

export type Gemini31FlashLiteModelName = keyof typeof model;
