import type { ModelConfig } from "../../../types";

export const models = {
  "o4-mini": {
    name: "OpenAI o4 Mini",
    author: "openai",
    description:
      "o4-mini is our latest small o-series model. It's optimized for fast, effective reasoning with exceptionally efficient performance in coding and visual tasks. It's succeeded by GPT-5 mini.",
    contextLength: 200000,
    maxOutputTokens: 100000,
    created: "2024-06-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type O4ModelName = keyof typeof models;
