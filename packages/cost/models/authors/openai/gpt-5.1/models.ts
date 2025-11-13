import type { ModelConfig } from "../../../types";

export const models = {
  "gpt-5.1": {
    name: "OpenAI GPT-5.1",
    author: "openai",
    description:
      "GPT-5.1 is an enhanced version of GPT-5 with improved performance and capabilities. It features the same 400K context window and advanced tool calling capabilities as GPT-5, with optimized pricing for better cost efficiency.",
    contextLength: 400000,
    maxOutputTokens: 128000,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text", "image"] },
    tokenizer: "GPT",
  },
  "gpt-5.1-codex": {
    name: "OpenAI: GPT-5.1 Codex",
    author: "openai",
    description: "Specialized model for code generation and analysis, based on GPT-5.1",
    contextLength: 400000,
    maxOutputTokens: 128000,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text", "image"] },
    tokenizer: "GPT",
  },
  "gpt-5.1-codex-mini": {
    name: "OpenAI: GPT-5.1 Codex Mini",
    author: "openai",
    description: "Compact specialized model for code generation and analysis, based on GPT-5.1",
    contextLength: 400000,
    maxOutputTokens: 128000,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text", "image"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type GPT51ModelName = keyof typeof models;
