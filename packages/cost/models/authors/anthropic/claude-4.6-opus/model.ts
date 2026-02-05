import type { ModelConfig } from "../../../types";

export const models = {
  "claude-4.6-opus": {
    name: "Anthropic: Claude Opus 4.6",
    author: "anthropic",
    description:
      "Claude Opus 4.6 is Anthropic's most capable model to date, released February 2026. Building on the intelligence of Opus 4.5, it brings new levels of reliability and precision to coding, agents, and enterprise workflows. Features a 1M context window, hybrid reasoning with extended thinking, and state-of-the-art performance on coding and agentic tasks. API model name: claude-opus-4-6",
    contextLength: 1000000,
    maxOutputTokens: 64000,
    created: "2026-02-05T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Claude",
  },
} satisfies Record<string, ModelConfig>;

export type ClaudeOpus46ModelName = keyof typeof models;
