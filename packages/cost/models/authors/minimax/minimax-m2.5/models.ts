import { ModelConfig } from "../../../types";

export const models = {
  "minimax-m2.5": {
    name: "MiniMax M2.5",
    author: "minimax",
    description:
      "MiniMax M2.5 language model served via HPC-AI OpenAI-compatible inference.",
    contextLength: 262_144,
    maxOutputTokens: 16_384,
    created: "2025-04-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "Unknown",
  },
} satisfies Record<string, ModelConfig>;

export type MinimaxM25ModelName = keyof typeof models;
