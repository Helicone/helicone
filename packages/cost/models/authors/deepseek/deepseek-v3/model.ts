import type { ModelConfig } from "../../../types";

export const models = {
  "deepseek-v3": {
    name: "DeepSeek-V3",
    author: "deepseek",
    description:
      "DeepSeek-V3.1 (deepseek-chat) is a powerful generalist model with 671B parameters, offering exceptional performance at an economical price. It achieves strong results on mathematical reasoning, coding, and general language tasks. The model supports 128K context length with a default output of 4K tokens (max 8K) and features advanced capabilities like function calling and JSON output.",
    contextLength: 128_000,
    maxOutputTokens: 8_192,  // Maximum (default 4K)
    created: "2024-12-26T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type DeepSeekV3ModelName = keyof typeof models;