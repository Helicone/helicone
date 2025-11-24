import type { ModelConfig } from "../../../types";

export const models = {
  "claude-opus-4-5": {
    name: "Anthropic: Claude Opus 4.5",
    author: "anthropic",
    description:
      "Claude Opus 4.5 is Anthropic's flagship model released November 2025, representing the highest level of intelligence and capability. Features extended thinking, multilingual capabilities, vision processing, and exceptional performance across complex reasoning tasks. Training data cut-off: March 2025. API model name: claude-opus-4-5",
    contextLength: 200000,
    maxOutputTokens: 64000,
    created: "2025-11-24T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Claude",
  },
} satisfies Record<string, ModelConfig>;

export type ClaudeOpus45ModelName = keyof typeof models;
