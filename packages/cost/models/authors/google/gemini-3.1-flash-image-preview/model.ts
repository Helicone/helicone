import { ModelConfig } from "../../../types";

export const model = {
  "gemini-3.1-flash-image-preview": {
    name: "Google Gemini 3.1 Flash Image Preview",
    author: "google",
    description:
      "Gemini 3.1 Flash Image is Google's fast and cost-effective image generation model. It supports text and image inputs with text and image outputs, optimized for high-throughput image generation at lower cost than Gemini 3 Pro Image. This preview version supports native image generation with token-based pricing.",
    contextLength: 65_536,
    maxOutputTokens: 32_768,
    created: "2026-01-15T00:00:00",
    modality: { inputs: ["text", "image"], outputs: ["text", "image"] },
    tokenizer: "Gemini",
  },
} satisfies Record<string, ModelConfig>;

export type Gemini31FlashImagePreviewModelName = keyof typeof model;
