import type { ModelConfig } from "../../../types";

export const models = {
  o1: {
    name: "OpenAI: o1",
    author: "openai",
    description:
      "The latest and strongest model family from OpenAI, o1 is designed to spend more time thinking before responding. The o1 model series is trained with large-scale reinforcement learning to reason using chain of thought. \n\nThe o1 models are optimized for math, science, programming, and other STEM-related tasks. They consistently exhibit PhD-level accuracy on benchmarks in physics, chemistry, and biology. Learn more in the launch announcement.",
    contextLength: 200000,
    maxOutputTokens: 100000,
    created: "2024-12-17T18:26:39.000Z",
    modality: "text+image->text",
    tokenizer: "GPT",
  },
  "o1-pro": {
    name: "OpenAI: o1-pro",
    author: "openai",
    description:
      "The o1 series of models are trained with reinforcement learning to think before they answer and perform complex reasoning. The o1-pro model uses more compute to think harder and provide consistently better answers.",
    contextLength: 200000,
    maxOutputTokens: 100000,
    created: "2025-03-19T22:26:51.000Z",
    modality: "text+image->text",
    tokenizer: "GPT",
  },
  "o1-mini": {
    name: "OpenAI: o1-mini",
    author: "openai",
    description:
      "The latest and strongest model family from OpenAI, o1 is designed to spend more time thinking before responding.\n\nThe o1 models are optimized for math, science, programming, and other STEM-related tasks. They consistently exhibit PhD-level accuracy on benchmarks in physics, chemistry, and biology. Learn more in the launch announcement.\n\nNote: This model is currently experimental and not suitable for production use-cases, and may be heavily rate-limited.",
    contextLength: 128000,
    maxOutputTokens: 65536,
    created: "2024-09-12T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type O1ModelName = keyof typeof models;
