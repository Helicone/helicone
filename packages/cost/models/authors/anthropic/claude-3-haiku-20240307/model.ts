import type { ModelConfig } from "../../../types";

export const models = {
  "claude-3-haiku-20240307": {
    name: "Anthropic: Claude 3 Haiku",
    author: "anthropic",
    description:
      "Claude 3 Haiku is Anthropic's fastest and most compact model. Designed for near-instant responsiveness and seamless AI experiences that mimic human interactions. Multilingual and vision capabilities. 4,096 max output tokens. Training data cut-off: August 2023. API model name: claude-3-haiku-20240307",
    contextLength: 200000,
    maxOutputTokens: 4096,
    created: "2024-03-07T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Claude",
  },
} satisfies Record<string, ModelConfig>;

export type Claude3HaikuModelName = keyof typeof models;
