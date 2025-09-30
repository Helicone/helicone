import type { ModelConfig } from "../../../types";

export const models = {
  "claude-4.5-sonnet": {
    name: "Anthropic: Claude Sonnet 4.5",
    author: "anthropic",
    description:
      "Best-in-class coding and agentic model with hours-long autonomous operation capabilities. Supports extended thinking, context awareness, parallel tool usage, and vision processing. Refined concise communication style with 64,000 max output tokens. API model name: claude-sonnet-4-5-20250929",
    contextLength: 200000,
    maxOutputTokens: 64000,
    created: "2025-09-29T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Claude",
  },
} satisfies Record<string, ModelConfig>;

export type ClaudeSonnet45ModelName = keyof typeof models;
