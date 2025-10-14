import type { ModelConfig } from "../../../types";

export const models = {
  "deepseek-reasoner": {
    name: "DeepSeek-Reasoner",
    author: "deepseek",
    description:
      "DeepSeek-Reasoner (DeepSeek-V3.1 Thinking Mode) is designed for advanced reasoning, mathematical problem-solving, and complex coding tasks. It uses chain-of-thought reasoning to break down complex problems and achieve superior performance on reasoning benchmarks. Supports 128K context with a default output of 32K tokens (max 64K) for extensive reasoning chains.",
    contextLength: 128_000,
    maxOutputTokens: 64_000, // Maximum (default 32K)
    created: "2025-01-20T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "DeepSeek",
  },
  "deepseek-tng-r1t2-chimera": {
    name: "DeepSeek TNG R1T2 Chimera",
    author: "deepseek",
    description:
      "DeepSeek-TNG-R1T2-Chimera is the second-generation Chimera model from TNG Tech. It is a 671 B-parameter mixture-of-experts text-generation model assembled from DeepSeek-AI’s R1-0528, R1, and V3-0324 checkpoints with an Assembly-of-Experts merge. The tri-parent design yields strong reasoning performance while running roughly 20 % faster than the original R1 and more than 2× faster than R1-0528 under vLLM, giving a favorable cost-to-intelligence trade-off. The checkpoint supports contexts up to 60 k tokens in standard use (tested to ~130 k) and maintains consistent <think> token behaviour, making it suitable for long-context analysis, dialogue and other open-ended generation tasks.",
    contextLength: 130_000,
    maxOutputTokens: 163_840,
    created: "2025-07-02T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "DeepSeek",
  },
} satisfies Record<string, ModelConfig>;

export type DeepSeekReasonerModelName = keyof typeof models;
