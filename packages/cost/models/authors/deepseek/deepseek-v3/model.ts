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
    tokenizer: "DeepSeek",
  },
  "deepseek-v3.1-terminus": {
    name: "DeepSeek-V3.1-Terminus",
    author: "deepseek",
    description:
      "DeepSeek-V3.1 Terminus is an update to DeepSeek V3.1 that maintains the model's original capabilities while addressing issues reported by users, including language consistency and agent capabilities, further optimizing the model's performance in coding and search agents. It is a large hybrid reasoning model (671B parameters, 37B active) that supports both thinking and non-thinking modes. It extends the DeepSeek-V3 base with a two-phase long-context training process. Users can control the reasoning behaviour with the reasoning enabled boolean. The model improves tool use, code generation, and reasoning efficiency, achieving performance comparable to DeepSeek-R1 on difficult benchmarks while responding more quickly. It supports structured tool calling, code agents, and search agents, making it suitable for research, coding, and agentic workflows.",
    contextLength: 128_000,
    maxOutputTokens: 16_384,
    created: "2025-09-22T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "DeepSeek",
  },
} satisfies Record<string, ModelConfig>;

export type DeepSeekV3ModelName = keyof typeof models;
