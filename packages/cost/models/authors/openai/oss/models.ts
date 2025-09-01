import { ModelConfig } from "../../../types";

export const models = {
  "gpt-oss-120b": {
    name: "OpenAI: gpt-oss-120b",
    author: "openai",
    description:
      "gpt-oss-120b is OpenAI's most powerful open-weight model, which fits into a single H100 GPU (117B parameters with 5.1B active parameters).",
    contextLength: 131000,
    maxOutputTokens: 131000,
    created: "2025-08-05T10:17:11",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "gpt-oss-20b": {
    name: "OpenAI: gpt-oss-20b",
    author: "openai",
    description:
      "gpt-oss-20b is OpenAI's medium-sized open-weight model for low latency, local, or specialized use-cases (21B parameters with 3.6B active parameters).",
    contextLength: 131000,
    maxOutputTokens: 131000,
    created: "2025-08-05T10:17:09",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type GPTOSSModelName = keyof typeof models;
