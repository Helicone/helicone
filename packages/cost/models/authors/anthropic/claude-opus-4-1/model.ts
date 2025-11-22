import type { ModelConfig } from "../../../types";

export const models = {
  "claude-opus-4-1": {
    name: "Anthropic: Claude Opus 4.1",
    author: "anthropic",
    description:
      "Our most capable model with the highest level of intelligence and capability. Supports extended thinking, multilingual capabilities, and vision processing. Moderately fast latency with 32,000 max output tokens. Training data cut-off: March 2025. API model name: claude-opus-4-1-20250805",
    contextLength: 200000,
    maxOutputTokens: 32000,
    created: "2025-08-05T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Claude",
    stripeModelId: "claude-opus-4.1",
  },
} satisfies Record<string, ModelConfig>;

export type ClaudeOpus41ModelName = keyof typeof models;
