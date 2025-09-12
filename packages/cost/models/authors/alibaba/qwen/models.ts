import { ModelConfig } from "../../../types";

export const models = {
  "Qwen/Qwen3-32B": {
    name: "Qwen3-32B",
    author: "alibaba",
    description:
      "Qwen3-32B is a 32.8 billion parameter language model that uniquely supports seamless switching between thinking mode for complex reasoning tasks and non-thinking mode for efficient general dialogue within a single model. The model excels across 100+ languages with enhanced reasoning capabilities, superior human preference alignment, and strong agent-based task performance, supporting up to 131,072 tokens with YaRN extension.",
    contextLength: 131_072,
    maxOutputTokens: 40_960,
    created: "2025-04-28T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type QwenModelName = keyof typeof models;
