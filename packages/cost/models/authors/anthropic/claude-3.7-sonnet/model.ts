import type { ModelConfig } from "../../../types";

export const models = {
  "claude-3.7-sonnet": {
    name: "Anthropic: Claude 3.7 Sonnet",
    author: "anthropic",
    description:
      "High-performance model with toggleable extended thinking for complex reasoning tasks. Combines high intelligence with the ability to think through problems step-by-step. Fast latency with 64,000 max output tokens. API model name: claude-3-7-sonnet-20250219",
    contextLength: 200000,
    maxOutputTokens: 64000,
    created: "2025-02-19T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Claude",
    stripeModelId: "claude-3-7-sonnet",
  },
} satisfies Record<string, ModelConfig>;

export type Claude37SonnetModelName = keyof typeof models;
