import type { ModelConfig } from "../../../types";

export const models = {
  o3: {
    name: "OpenAI: o3",
    author: "openai",
    description:
      "o3 is a well-rounded and powerful model across domains. It sets a new standard for math, science, coding, and visual reasoning tasks. It also excels at technical writing and instruction-following. Use it to think through multi-step problems that involve analysis across text, code, and images. o3 is succeeded by GPT-5.",
    contextLength: 200000,
    maxOutputTokens: 100000,
    created: "2024-06-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "o3-pro": {
    name: "OpenAI: o3 Pro",
    author: "openai",
    description:
      "The o-series of models are trained with reinforcement learning to think before they answer and perform complex reasoning. The o3-pro model uses more compute to think harder and provide consistently better answers. o3-pro is available in the Responses API only to enable support for multi-turn model interactions before responding to API requests. Since o3-pro is designed to tackle tough problems, some requests may take several minutes to finish.",
    contextLength: 200000,
    maxOutputTokens: 100000,
    created: "2024-06-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "o3-mini": {
    name: "OpenAI: o3 Mini",
    author: "openai",
    description:
      "o3-mini is our newest small reasoning model, providing high intelligence at the same cost and latency targets of o1-mini. o3-mini supports key developer features, like Structured Outputs, function calling, and Batch API. This model supports the `reasoning_effort` parameter, which can be set to 'high', 'medium', or 'low' to control the thinking time of the model.",
    contextLength: 200000,
    maxOutputTokens: 100000,
    created: "2023-10-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type O3ModelName = keyof typeof models;
