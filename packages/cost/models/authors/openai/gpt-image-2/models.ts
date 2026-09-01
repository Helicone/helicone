import type { ModelConfig } from "../../../types";

export const models = {
  "gpt-image-2": {
    name: "OpenAI GPT Image 2",
    author: "openai",
    description:
      "GPT Image 2 is OpenAI's advanced image generation model with superior text rendering, instruction following, and image editing capabilities. It supports text and image inputs to produce high-fidelity images.",
    contextLength: 8192,
    maxOutputTokens: 4096,
    created: "2025-03-25T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["image", "text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type GPTImage2ModelName = keyof typeof models;
