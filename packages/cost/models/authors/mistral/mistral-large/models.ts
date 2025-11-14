import type { ModelConfig } from "../../../types";

export const models = {
  "mistral-large-2411": {
    name: "Mistral-Large",
    author: "mistral",
    description: "Mistral Large 2.1",
    contextLength: 128_000,
    maxOutputTokens: 32_768,
    created: "2024-07-24T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "Mistral",
  },
} satisfies Record<string, ModelConfig>;

export type MistralLargeModelName = keyof typeof models;
