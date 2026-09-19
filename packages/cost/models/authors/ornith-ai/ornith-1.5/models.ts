import type { ModelConfig } from "../../../types";

export const models = {
  "ornith-1.5-35b-a3b": {
    name: "Ornith 1.5 35B A3B",
    author: "ornith-ai",
    description:
      "Ornith-1.5-35B-A3B is a reasoning-focused mixture-of-experts model with about 3 billion activated parameters per token. It is designed for agentic coding, tool use, and long-context tasks.",
    contextLength: 262_144,
    maxOutputTokens: 262_144,
    created: "2026-08-18T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Qwen",
  },
} satisfies Record<string, ModelConfig>;

export type Ornith15ModelName = keyof typeof models;
