import type { ModelConfig } from "../../../types";

export const models = {
  "claude-haiku-4-5-20251001": {
    name: "Anthropic: Claude 4.5 Haiku (20251001)",
    author: "anthropic",
    description:
      "Our fastest model. Intelligence at blazing speeds. Multilingual and vision capabilities. 8,192 max output tokens. Training data cut-off: October 2024. API model name: claude-haiku-4-5-20251001",
    contextLength: 200000,
    maxOutputTokens: 8192,
    created: "2025-10-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Claude",
  },
} satisfies Record<string, ModelConfig>;

export type ClaudeHaiku4520251001ModelName = keyof typeof models;
