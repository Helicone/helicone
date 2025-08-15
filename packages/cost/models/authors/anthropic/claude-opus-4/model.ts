import type { ModelConfig } from "../../../types";

export const models = {
  "claude-opus-4": {
    name: "Anthropic: Claude Opus 4",
    author: "anthropic",
    description:
      "Our previous flagship model with very high intelligence and capability. Supports extended thinking, multilingual capabilities, and vision processing. Moderately fast latency with 32,000 max output tokens. Training data cut-off: March 2025. API model name: claude-opus-4-20250514",
    contextLength: 200000,
    maxOutputTokens: 32000,
    created: "2025-05-14T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },
} satisfies Record<string, ModelConfig>;

export type ClaudeOpus4ModelName = keyof typeof models;
