import type { Model } from "../../../types";

export const models = {
  // "grok-2-1212": {
  //   name: "xAI: Grok 2 1212",
  //   author: "x-ai",
  //   description:
  //     "Grok 2 1212 introduces significant enhancements to accuracy, instruction adherence, and multilingual support, making it a powerful and flexible choice for developers seeking a highly steerable, intelligent model.",
  //   contextLength: 131072,
  //   maxOutputTokens: 4000,
  //   created: "2024-12-15T03:20:14.000Z",
  //   modality: "text->text",
  //   tokenizer: "Grok",
  // },
  // "grok-2-vision-1212": {
  //   name: "xAI: Grok 2 Vision 1212",
  //   author: "x-ai",
  //   description:
  //     "Grok 2 Vision 1212 advances image-based AI with stronger visual comprehension, refined instruction-following, and multilingual support. From object recognition to style analysis, it empowers developers to build more intuitive, visually aware applications. Its enhanced steerability and reasoning establish a robust foundation for next-generation image solutions.\n\nTo read more about this model, check out [xAI's announcement](https://x.ai/blog/grok-1212).",
  //   contextLength: 32768,
  //   maxOutputTokens: 4000,
  //   created: "2024-12-15T04:35:38.000Z",
  //   modality: "text+image->text",
  //   tokenizer: "Grok",
  // },
  // "grok-vision-beta": {
  //   name: "xAI: Grok Vision Beta",
  //   author: "x-ai",
  //   description:
  //     "Grok Vision Beta is xAI's experimental language model with vision capability.\n\n",
  //   contextLength: 8192,
  //   maxOutputTokens: 4000,
  //   created: "2024-11-19T00:37:04.000Z",
  //   modality: "text+image->text",
  //   tokenizer: "Grok",
  // },
} satisfies Record<string, Model>;