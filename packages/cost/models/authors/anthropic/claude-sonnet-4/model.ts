import type { Model } from "../../../types";

export const models = {
  "claude-sonnet-4": {
    name: "Anthropic: Claude Sonnet 4",
    author: "anthropic",
    description:
      "High-performance model with high intelligence and balanced performance. Supports extended thinking, multilingual capabilities, and vision processing. Fast latency with 64,000 max output tokens. API model name: claude-sonnet-4-20250514",
    contextLength: 200000,
    maxOutputTokens: 64000,
    created: "2025-05-14T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },
} satisfies Record<string, Model>;