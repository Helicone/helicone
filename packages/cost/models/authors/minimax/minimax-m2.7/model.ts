import type { ModelConfig } from "../../../types";

export const models = {
  "minimax-m2.7": {
    name: "MiniMax M2.7",
    author: "minimax",
    description:
      "MiniMax-M2.7 is MiniMax's most capable large language model with 1M token context window. It features advanced reasoning, function calling, and JSON output capabilities, delivering strong performance across coding, mathematical reasoning, and general language tasks.",
    contextLength: 1_000_000,
    maxOutputTokens: 16_384,
    created: "2025-03-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "MiniMax",
  },
  "minimax-m2.7-highspeed": {
    name: "MiniMax M2.7 Highspeed",
    author: "minimax",
    description:
      "MiniMax-M2.7-highspeed is an optimized variant of MiniMax-M2.7, offering faster inference speeds while maintaining strong performance. Suitable for latency-sensitive applications with 1M token context support.",
    contextLength: 1_000_000,
    maxOutputTokens: 16_384,
    created: "2025-03-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "MiniMax",
  },
} satisfies Record<string, ModelConfig>;

export type MiniMaxM27ModelName = keyof typeof models;
