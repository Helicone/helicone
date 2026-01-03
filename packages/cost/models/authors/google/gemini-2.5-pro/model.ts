import { ModelConfig } from "../../../types";

export const model = {
  "gemini-2.5-pro": {
    name: "Google Gemini 2.5 Pro",
    author: "google",
    description:
      "Gemini 2.5 Pro is Google’s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks. It employs “thinking” capabilities, enabling it to reason through responses with enhanced accuracy and nuanced context handling. Gemini 2.5 Pro achieves top-tier performance on multiple benchmarks, including first-place positioning on the LMArena leaderboard, reflecting superior human-preference alignment and complex problem-solving abilities.",
    contextLength: 1048576,
    maxOutputTokens: 65536,
    created: "2025-06-17T07:12:24",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Gemini",
    stripeModelId: "gemini-2-5-pro",
  },
} satisfies Record<string, ModelConfig>;

export type Gemini25ProModelName = keyof typeof model;
