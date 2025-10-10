import type { ModelConfig } from "../../../types";

export const models = {
  "gpt-image-1": {
    name: "OpenAI: GPT-Image-1",
    author: "openai",
    description:
      "GPT-Image-1 is OpenAI's advanced image generation and editing model that combines the capabilities of image creation with precise instruction following. It offers high-fidelity image generation with support for text input and image editing workflows. The model uses a token-based pricing structure with separate rates for text input tokens, image input tokens, and image output tokens.\n\n#multimodal #image-generation",
    contextLength: 128000,
    maxOutputTokens: 16384,
    created: "2025-01-15T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["image"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type GptImage1ModelName = keyof typeof models;
