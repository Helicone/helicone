import { ModelConfig } from "../../../types";

export const model = {
  "gemini-2.5-flash": {
    name: "Google Gemini 2.5 Flash",
    author: "google",
    description:
      'Gemini 2.5 Flash is Google\'s state-of-the-art workhorse model, specifically designed for advanced reasoning, coding, mathematics, and scientific tasks. It includes built-in "thinking" capabilities, enabling it to provide responses with greater accuracy and nuanced context handling. \n\nAdditionally, Gemini 2.5 Flash is configurable through the "max tokens for reasoning" parameter, allowing fine-tuned control over its reasoning process.',
    contextLength: 1048576,
    maxOutputTokens: 65535,
    created: "2025-06-17T08:01:28",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Gemini",
  },
} satisfies Record<string, ModelConfig>;

export type Gemini25FlashModelName = keyof typeof model;
