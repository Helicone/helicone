import type { ModelConfig } from "../../../types";

export const models = {
  "gpt-5.4": {
    name: "OpenAI GPT-5.4",
    author: "openai",
    description:
      "GPT-5.4 is our frontier model for complex professional work. Reasoning.effort supports: none (default), low, medium, high and xhigh. Features a 1.05M context window and 128K max output tokens with improvements in general intelligence, instruction following, accuracy, multimodality, code generation, tool calling, and context management over GPT-5.2.",
    contextLength: 1_050_000,
    maxOutputTokens: 128_000,
    created: "2026-03-05T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "gpt-5.4-2026-03-05": {
    name: "OpenAI GPT-5.4",
    author: "openai",
    description:
      "GPT-5.4 is our frontier model for complex professional work. Reasoning.effort supports: none (default), low, medium, high and xhigh. Features a 1.05M context window and 128K max output tokens with improvements in general intelligence, instruction following, accuracy, multimodality, code generation, tool calling, and context management over GPT-5.2.",
    contextLength: 1_050_000,
    maxOutputTokens: 128_000,
    created: "2026-03-05T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
    pinnedVersionOfModel: "gpt-5.4",
  },
} satisfies Record<string, ModelConfig>;

export type GPT54ModelName = keyof typeof models;
