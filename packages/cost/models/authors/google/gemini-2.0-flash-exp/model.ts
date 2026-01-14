import { ModelConfig } from "../../../types";

export const model = {
  "gemini-2.0-flash-exp": {
    name: "Google Gemini 2.0 Flash Experimental",
    author: "google",
    description:
      "Experimental version of Gemini 2.0 Flash with native image generation capabilities. Features multimodal input and output support including text and images.",
    contextLength: 1_000_000,
    maxOutputTokens: 8_192,
    created: "2024-12-11T00:00:00",
    modality: { inputs: ["text", "image"], outputs: ["text", "image"] },
    tokenizer: "Gemini",
  },
} satisfies Record<string, ModelConfig>;

export type Gemini20FlashExpModelName = keyof typeof model;
