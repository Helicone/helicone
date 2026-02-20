import { ModelConfig } from "../../../types";

export const model = {
  "gemini-3.1-pro-preview": {
    name: "Google Gemini 3.1 Pro Preview",
    author: "google",
    description:
      "Gemini 3.1 Pro Preview is Google's latest AI model with significantly improved reasoning capabilities. Achieves 77.1% on ARC-AGI-2 (more than double Gemini 3 Pro). Features advanced coding, complex problem-solving, and multimodal capabilities with a 1M token context window.",
    contextLength: 1_048_576,
    maxOutputTokens: 65_536,
    created: "2026-02-19T00:00:00",
    modality: { inputs: ["text", "image", "audio", "video"], outputs: ["text"] },
    tokenizer: "Gemini",
  },
} satisfies Record<string, ModelConfig>;

export type Gemini31ProPreviewModelName = keyof typeof model;
