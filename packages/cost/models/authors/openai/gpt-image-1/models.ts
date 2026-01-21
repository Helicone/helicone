import type { ModelConfig } from "../../../types";

export const models = {
  "gpt-image-1": {
    name: "OpenAI GPT Image 1",
    author: "openai",
    description:
      "GPT Image 1 is OpenAI's image generation model that turns text and image inputs into high-fidelity images. It offers strong instruction following and image preservation capabilities.",
    contextLength: 8192,
    maxOutputTokens: 4096,
    created: "2025-04-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["image", "text"] },
    tokenizer: "GPT",
  },
  "gpt-image-1.5": {
    name: "OpenAI GPT Image 1.5",
    author: "openai",
    description:
      "GPT Image 1.5 is OpenAI's state-of-the-art image generation model with better instruction following, 4× faster generation, and cheaper image tokens than GPT Image 1. It offers improved image preservation and editing capabilities.",
    contextLength: 8192,
    maxOutputTokens: 4096,
    created: "2025-12-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["image", "text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type GPTImage1ModelName = keyof typeof models;
