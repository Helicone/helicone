import type { ModelConfig } from "../../../types";

export const models = {
  "claude-4.8-opus": {
    name: "Anthropic: Claude Opus 4.8",
    author: "anthropic",
    description:
      "Claude Opus 4.8 is Anthropic's Opus-tier model released May 2026, now a legacy model succeeded by Claude Opus 5. Features a 1M context window, 128K max output, adaptive thinking, and text and image input. API model name: claude-opus-4-8",
    contextLength: 1000000,
    maxOutputTokens: 128000,
    created: "2026-05-28T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Claude",
  },
} satisfies Record<string, ModelConfig>;

export type ClaudeOpus48ModelName = keyof typeof models;
