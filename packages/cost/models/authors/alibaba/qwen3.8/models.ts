import { ModelConfig } from "../../../types";

export const models = {
  "qwen3.8-max": {
    name: "Qwen3.8 Max",
    author: "alibaba",
    description:
      "Flagship 2.4-trillion-parameter MoE model in the Qwen3.8 series with native visual understanding, excelling at coding, professional work, and long-horizon autonomous agent tasks.",
    contextLength: 1_000_000,
    maxOutputTokens: 131_072,
    created: "2026-08-02T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Qwen",
  },
} satisfies Record<string, ModelConfig>;

export type Qwen38ModelName = keyof typeof models;
