import type { Model } from "../../../types";

export const models = {
  "claude-3.5-sonnet-v2": {
    name: "Anthropic: Claude 3.5 Sonnet v2",
    author: "anthropic",
    description:
      "Our previous intelligent model with high level of intelligence and capability. Fast latency with multilingual and vision capabilities, but no extended thinking. 8,192 max output tokens. Training data cut-off: April 2024. Upgraded version API: claude-3-5-sonnet-20241022, Previous version API: claude-3-5-sonnet-20240620",
    contextLength: 200000,
    maxOutputTokens: 8192,
    created: "2024-10-22T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },
} satisfies Record<string, Model>;