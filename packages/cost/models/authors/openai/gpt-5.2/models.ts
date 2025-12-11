import type { ModelConfig } from "../../../types";

export const models = {
  "gpt-5.2": {
    name: "OpenAI GPT-5.2",
    author: "openai",
    description:
      "GPT-5.2 is OpenAI's latest flagship model with enhanced performance, reasoning capabilities, and improved instruction following. It features a 400K context window and supports both text and image inputs and outputs.",
    contextLength: 400000,
    maxOutputTokens: 128000,
    created: "2025-08-31T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text", "image"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type GPT52ModelName = keyof typeof models;
