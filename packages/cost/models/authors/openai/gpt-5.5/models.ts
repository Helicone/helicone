
import type { ModelConfig } from "../../../types";

export const models = {
  "gpt-5.5": {
    name: "OpenAI GPT-5.5",
    author: "openai",
    description:
      "GPT-5.5 is our newest frontier model for the most complex professional work. Learn more in our latest model guide. Reasoning.effort supports: none, low, medium (default), high and xhigh.",
    contextLength: 1_050_000,
    maxOutputTokens: 128_000,
    created: "2026-04-23T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type GPT55ModelName = keyof typeof models;
