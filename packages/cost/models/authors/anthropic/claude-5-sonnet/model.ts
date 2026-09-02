import type { ModelConfig } from "../../../types";

export const models = {
  "claude-5-sonnet": {
    name: "Anthropic: Claude Sonnet 5",
    author: "anthropic",
    description:
      "Claude Sonnet 5 is Anthropic's current Sonnet model, released June 2026, offering the best combination of speed and intelligence. Features a 1M context window, 128K max output, adaptive thinking on by default, and text and image input. API model name: claude-sonnet-5",
    contextLength: 1000000,
    maxOutputTokens: 128000,
    created: "2026-06-30T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Claude",
  },
} satisfies Record<string, ModelConfig>;

export type ClaudeSonnet5ModelName = keyof typeof models;
