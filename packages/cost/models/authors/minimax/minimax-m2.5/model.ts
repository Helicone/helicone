import type { ModelConfig } from "../../../types";

export const models = {
  "minimax-m2.5": {
    name: "MiniMax M2.5",
    author: "minimax",
    description:
      "MiniMax-M2.5 is a high-performance large language model with 204K token context window. It supports function calling, JSON output, and delivers strong results on coding, reasoning, and general language tasks.",
    contextLength: 204_000,
    maxOutputTokens: 8_192,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "MiniMax",
  },
  "minimax-m2.5-highspeed": {
    name: "MiniMax M2.5 Highspeed",
    author: "minimax",
    description:
      "MiniMax-M2.5-highspeed is an optimized variant of MiniMax-M2.5, offering faster inference at reduced cost. Ideal for high-throughput and latency-sensitive workloads with 204K context support.",
    contextLength: 204_000,
    maxOutputTokens: 8_192,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "MiniMax",
  },
} satisfies Record<string, ModelConfig>;

export type MiniMaxM25ModelName = keyof typeof models;
