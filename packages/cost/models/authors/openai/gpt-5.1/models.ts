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
  "gpt-5.1-chat-latest": {
    name: "OpenAI GPT-5.1 Chat",
    author: "openai",
    description:
      "GPT-5.1 Chat is a continuously updated version of GPT-5.1 optimized for conversational interactions. It receives regular updates with the latest improvements in dialogue management, safety, and helpfulness. Features a 128K context window and 16K max output tokens, making it ideal for focused conversations.",
    contextLength: 128000,
    maxOutputTokens: 16384,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text", "image"] },
    tokenizer: "GPT",
  },
  "codex-mini-latest": {
    name: "OpenAI Codex Mini Latest",
    author: "openai",
    description: "Latest version of Codex Mini, a compact specialized model for code generation and analysis",
    contextLength: 200000,
    maxOutputTokens: 100000,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "gpt-5.1-2025-11-13": {
    name: "OpenAI GPT-5.1",
    author: "openai",
    description:
      "GPT-5.1 is an enhanced version of GPT-5 with improved performance and capabilities. It features the same 400K context window and advanced tool calling capabilities as GPT-5, with optimized pricing for better cost efficiency.",
    contextLength: 400000,
    maxOutputTokens: 128000,
    created: "2025-11-13T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text", "image"] },
    tokenizer: "GPT",
    pinnedVersionOfModel: "gpt-5.1",
  },
} satisfies Record<string, ModelConfig>;

export type GPT51ModelName = keyof typeof models;
