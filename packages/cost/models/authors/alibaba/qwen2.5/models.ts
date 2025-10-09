import { ModelConfig } from "../../../types";

export const models = {
  "qwen2.5-coder-7b-fast": {
    name: "Qwen2.5 Coder 7B fast",
    author: "qwen",
    description:
      "Qwen2.5 is the latest series of Qwen large language models. For Qwen2.5, we release a number of base language models and instruction-tuned language models ranging from 0.5 to 72 billion parameters.",
    contextLength: 32_000,
    maxOutputTokens: 8_192,
    created: "2024-09-15T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "Qwen",
  },
} satisfies Record<string, ModelConfig>;

export type Qwen25ModelName = keyof typeof models;
