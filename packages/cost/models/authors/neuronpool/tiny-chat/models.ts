import type { ModelConfig } from "../../../types";

export const models = {
  "neuronpool-tiny-chat": {
    name: "NeuronPool Tiny Chat",
    author: "neuronpool",
    description: "Small chat model used for NeuronPool pool/self smoke tests.",
    contextLength: 4096,
    maxOutputTokens: 4096,
    created: "2025-09-02T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type NeuronpoolTinyChatModelName = keyof typeof models;
