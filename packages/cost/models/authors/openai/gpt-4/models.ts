import type { ModelConfig } from "../../../types";

export const models = {
  "gpt-4": {
    name: "OpenAI: GPT-4",
    author: "openai",
    description:
      "OpenAI's flagship model, GPT-4 is a large-scale multimodal language model capable of solving difficult problems with greater accuracy than previous models due to its broader general knowledge and advanced reasoning capabilities. Training data: up to Sep 2021.",
    contextLength: 8191,
    maxOutputTokens: 4096,
    created: "2023-05-28T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type GPT4ModelName = keyof typeof models;
