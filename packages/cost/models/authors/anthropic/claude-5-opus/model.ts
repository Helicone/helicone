import type { ModelConfig } from "../../../types";

export const models = {
  "claude-5-opus": {
    name: "Anthropic: Claude Opus 5",
    author: "anthropic",
    description:
      "Claude Opus 5 is Anthropic's current Opus model, released July 2026, for complex agentic coding and enterprise work. Features a 1M context window, 128K max output, adaptive thinking on by default, and text and image input. API model name: claude-opus-5",
    contextLength: 1000000,
    maxOutputTokens: 128000,
    created: "2026-07-24T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Claude",
  },
} satisfies Record<string, ModelConfig>;

export type ClaudeOpus5ModelName = keyof typeof models;
