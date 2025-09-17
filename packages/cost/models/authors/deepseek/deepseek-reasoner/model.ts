import type { ModelConfig } from "../../../types";

export const models = {
  "deepseek-reasoner": {
    name: "DeepSeek-Reasoner",
    author: "deepseek",
    description:
      "DeepSeek-Reasoner (DeepSeek-V3.1 Thinking Mode) is designed for advanced reasoning, mathematical problem-solving, and complex coding tasks. It uses chain-of-thought reasoning to break down complex problems and achieve superior performance on reasoning benchmarks. Supports 128K context with a default output of 32K tokens (max 64K) for extensive reasoning chains.",
    contextLength: 128_000,
    maxOutputTokens: 64_000,  // Maximum (default 32K)
    created: "2025-01-20T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type DeepSeekReasonerModelName = keyof typeof models;