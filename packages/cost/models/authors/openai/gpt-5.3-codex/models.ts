import type { ModelConfig } from "../../../types";

export const models = {
  "gpt-5.3-codex": {
    name: "OpenAI GPT-5.3 Codex",
    author: "openai",
    description: "Codex model based on GPT-5.3 for code generation and analysis.",
    contextLength: 400000,
    maxOutputTokens: 128000,
    created: "2026-01-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "gpt-5.3-codex-spark": {
    name: "OpenAI GPT-5.3 Codex Spark",
    author: "openai",
    description: "Lower-latency Codex variant based on GPT-5.3.",
    contextLength: 400000,
    maxOutputTokens: 128000,
    created: "2026-01-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type GPT53CodexModelName = keyof typeof models;
