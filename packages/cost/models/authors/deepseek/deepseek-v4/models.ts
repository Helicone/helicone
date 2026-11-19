import type { ModelConfig } from "../../../types";

export const models = {
  "deepseek-v4.1-flash": {
    name: "DeepSeek V4.1 Flash",
    author: "deepseek",
    description:
      "DeepSeek V4.1 Flash is the fast multimodal variant of DeepSeek V4.1, supporting text and image inputs with a 1M token context window for latency-sensitive and high-throughput workloads.",
    contextLength: 1_048_576,
    maxOutputTokens: 65_536,
    created: "2026-09-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "DeepSeek",
  },
  "deepseek-v4-flash-0731": {
    name: "DeepSeek V4 Flash (0731)",
    author: "deepseek",
    description:
      "DeepSeek V4 Flash (0731) is the July 31 snapshot of DeepSeek V4 Flash, a cost-efficient general-purpose chat model with a 1M token context window.",
    contextLength: 1_048_576,
    maxOutputTokens: 65_536,
    created: "2026-07-31T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "DeepSeek",
  },
} satisfies Record<string, ModelConfig>;

export type DeepSeekV4ModelName = keyof typeof models;
