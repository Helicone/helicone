import { ModelConfig } from "../../../types";

export const model = {
  "gemini-2.5-flash-image": {
    name: "Google Gemini 2.5 Flash Image",
    author: "google",
    description:
      "Gemini 2.5 Flash Image is Google's native image generation model built on the Gemini 2.5 Flash architecture. It combines advanced reasoning capabilities with image generation, supporting both text and image inputs to generate high-quality images with precise control and understanding.",
    contextLength: 1048576,
    maxOutputTokens: 65535,
    created: "2025-06-17T08:01:28",
    modality: { inputs: ["text", "image"], outputs: ["text", "image"] },
    tokenizer: "Gemini",
  },
} satisfies Record<string, ModelConfig>;

export type Gemini25FlashImageModelName = keyof typeof model;
