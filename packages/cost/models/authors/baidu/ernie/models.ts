import type { ModelConfig } from "../../../types";

export const models = {
  "ernie-4.5-21b-a3b-thinking": {
    name: "Baidu Ernie 4.5 21B A3B Thinking",
    author: "baidu",
    description:
      "ERNIE-4.5-21B-A3B-Thinking is a text-based Mixture of Experts (MoE) post-training model featuring 21B total parameters with 3B active parameters per token. It delivers enhanced performance on reasoning tasks, including logical reasoning, mathematics, science, coding, text generation, and academic benchmarks that typically require human expertise. The model offers efficient tool utilization capabilities and supports up to 128K tokens for long-context understanding.",
    contextLength: 128_000,
    maxOutputTokens: 8_000,
    created: "2025-09-10T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "Baidu",
  }
} satisfies Record<string, ModelConfig>;

export type ErnieModelName = keyof typeof models;
