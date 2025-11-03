import type { ModelConfig } from "../../../types";

export const models = {
  "mistral-nemo": {
    name: "Mistral Nemo",
    author: "mistralai",
    description:
      "The Mistral-Nemo-Instruct-2407 Large Language Model (LLM) is an instruct fine-tuned version of the Mistral-Nemo-Base-2407. Trained jointly by Mistral AI and NVIDIA, it significantly outperforms existing models smaller or similar in size.",
    contextLength: 128_000,
    maxOutputTokens: 16_400,
    created: "2024-07-18T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Mistral",
  },
} satisfies Record<string, ModelConfig>;

export type MistralNemoModelName = keyof typeof models;
