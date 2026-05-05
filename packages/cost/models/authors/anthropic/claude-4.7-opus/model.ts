import type { ModelConfig } from "../../../types";

export const models = {
  "claude-4.7-opus": {
    name: "Anthropic: Claude Opus 4.7",
    author: "anthropic",
    description:
      "Claude Opus 4.7 is Anthropic's flagship model released April 2026, building on Opus 4.6 with continued advances in coding, agentic tasks, and enterprise workflows. Features a 1M context window, hybrid reasoning with extended thinking, and a new tokenizer. API model name: claude-opus-4-7",
    contextLength: 1000000,
    maxOutputTokens: 64000,
    created: "2026-04-16T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Claude",
  },
} satisfies Record<string, ModelConfig>;

export type ClaudeOpus47ModelName = keyof typeof models;
