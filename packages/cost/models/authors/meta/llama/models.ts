import { ModelConfig } from "../../../types";

export const models = {
  "meta-llama/llama-4-scout-17b-16e-instruct": {
    name: "Llama-4-Scout-17B-16E",
    author: "meta-llama",
    description:
      "Llama 4 instruction-tuned MoE (17B, 16 experts) for fast, high-quality chat, tool use, and multilingual reasoning with balanced latency and cost.",
    contextLength: 131_072,
    maxOutputTokens: 8_192,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "meta-llama/Llama-4-Maverick-17B-128E-Instruct": {
    name: "Llama-4-Maverick-17B-128E",
    author: "meta-llama",
    description:
      "Llama 4 instruction-tuned MoE (17B, 128 experts) targeting tougher reasoning and long-form tasks, trading more compute for higher response diversity and robustness.",
    contextLength: 131_072,
    maxOutputTokens: 8_192,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "meta-llama/Llama-Guard-4-12B": {
    name: "Llama-Guard-4-12B",
    author: "meta-llama",
    description:
      "Meta’s latest safety/guardrail model for prompt and output moderation, aligning conversations to policy via classification and constrained generation.",
    contextLength: 131_072,
    maxOutputTokens: 1_024,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "meta-llama/Llama-3.3-70B-Instruct": {
    name: "Llama-3.3-70B-Versatile",
    author: "meta-llama",
    description:
      "Flagship 70B instruction-tuned model for high-quality chat, coding, and reasoning with strong instruction-following and multilingual support.",
    contextLength: 131_072,
    maxOutputTokens: 32_678,
    created: "2024-12-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "meta-llama/Llama-3.1-8B": {
    name: "Llama-3.1-8B-Instant",
    author: "meta-llama",
    description:
      "Compact 8B general-purpose model offering efficient inference for chat, coding, and RAG workflows on limited compute.",
    contextLength: 131_072,
    maxOutputTokens: 32_678,
    created: "2024-07-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "meta-llama/Meta-Llama-3-70B-Instruct": {
    name: "Llama-3-70B",
    author: "meta-llama",
    description:
      "70B instruction-tuned model delivering strong conversational quality, tool use, and coding assistance across diverse domains.",
    contextLength: 8_192,
    maxOutputTokens: 16_384,
    created: "2024-04-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "meta-llama/Meta-Llama-3-8B": {
    name: "Llama-3-8B",
    author: "meta-llama",
    description:
      "8B general-purpose model for broad language tasks; a solid base for fine-tuning or lightweight production chat.",
    contextLength: 8_192,
    maxOutputTokens: 8_192,
    created: "2024-04-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "meta-llama/Llama-Guard-3-8B": {
    name: "Llama-Guard-3-8B",
    author: "meta-llama",
    description:
      "Prior-generation safety model for content moderation and policy enforcement, filtering prompts/outputs to reduce unsafe responses.",
    contextLength: 8_192,
    maxOutputTokens: 8_192,
    created: "2024-04-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type LlamaModelName = keyof typeof models;
