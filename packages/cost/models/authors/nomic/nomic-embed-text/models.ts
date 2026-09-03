import type { ModelConfig } from "../../../types";

export const models = {
  "nomic-embed-text": {
    name: "Nomic Embed Text",
    author: "nomic",
    description: "Nomic embed-text served on the NeuronPool public network.",
    contextLength: 8192,
    maxOutputTokens: 8192,
    created: "2024-02-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type NomicEmbedTextModelName = keyof typeof models;
