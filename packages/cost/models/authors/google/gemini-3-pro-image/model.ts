import { ModelConfig } from "../../../types";

export const model = {
  "gemini-3-pro-image-preview": {
    name: "Google Gemini 3 Pro Image Preview",
    author: "google",
    description:
      "Gemini 3 Pro Image is Google's native image generation model with state-of-the-art reasoning capabilities. It is the best model for complex and multi-turn image generation and editing, featuring improved accuracy and enhanced image quality. This preview version supports up to 14 input images and can generate up to 32 output images per request.",
    contextLength: 65_536,
    maxOutputTokens: 32_768,
    created: "2025-11-20T00:00:00",
    modality: { inputs: ["text", "image"], outputs: ["text", "image"] },
    tokenizer: "Gemini",
  },
} satisfies Record<string, ModelConfig>;

export type Gemini3ProImagePreviewModelName = keyof typeof model;
