import type { ModelConfig } from "../../../types";

export const models = {
  "claude-5.1-fable": {
    name: "Anthropic: Claude Fable 5.1",
    author: "anthropic",
    description:
      "Claude Fable 5.1 is Anthropic's most capable widely released model, released September 2026, for demanding reasoning and long-horizon agentic work. Features a 1M context window, 128K max output, adaptive thinking (always on), text and image input, and cache reads priced at 0.025x the base input price. API model name: claude-fable-5-1",
    contextLength: 1000000,
    maxOutputTokens: 128000,
    created: "2026-09-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Claude",
  },
} satisfies Record<string, ModelConfig>;

export type ClaudeFable51ModelName = keyof typeof models;
