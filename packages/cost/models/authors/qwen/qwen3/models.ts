import type { ModelConfig } from "../../../types";

export const models = {
  "qwen3-30b-a3b": {
    name: "Qwen: Qwen3-30B-A3B",
    author: "qwen",
    description:
      "Qwen3 is the latest generation of large language models in Qwen series, offering a comprehensive suite of dense and mixture-of-experts (MoE) models. Built upon extensive training, Qwen3 delivers groundbreaking advancements in reasoning, instruction-following, agent capabilities, and multilingual support.",
    contextLength: 41_000,
    maxOutputTokens: 41_000,
    created: "2025-06-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Qwen"
  },
} satisfies Record<string, ModelConfig>;

export type Qwen3ModelName = keyof typeof models;
