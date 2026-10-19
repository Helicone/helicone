import type { ModelConfig } from "../../../types";

export const models = {
  "claude-5-fable": {
    name: "Anthropic: Claude Fable 5",
    author: "anthropic",
    description:
      "Claude Fable 5 is Anthropic's Fable-tier model released June 2026 for demanding reasoning and long-horizon agentic work, now a legacy model succeeded by Claude Fable 5.1. Features a 1M context window, 128K max output, adaptive thinking (always on), and text and image input. API model name: claude-fable-5",
    contextLength: 1000000,
    maxOutputTokens: 128000,
    created: "2026-06-09T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Claude",
  },
} satisfies Record<string, ModelConfig>;

export type ClaudeFable5ModelName = keyof typeof models;
