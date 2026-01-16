import type { ModelConfig } from "../../../types";

export const models = {
  "claude-3.5-haiku": {
    name: "Anthropic: Claude 3.5 Haiku",
    author: "anthropic",
    description:
      "Our fastest model. Intelligence at blazing speeds. Multilingual and vision capabilities. 8,192 max output tokens. Training data cut-off: July 2024. API model name: claude-3-5-haiku-20241022",
    contextLength: 200000,
    maxOutputTokens: 8192,
    created: "2024-10-22T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Claude",
    stripeModelId: "claude-3-5-haiku",
  },
} satisfies Record<string, ModelConfig>;

export type Claude35HaikuModelName = keyof typeof models;
