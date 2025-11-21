import { ModelConfig } from "../../../types";

export const models = {
  "kimi-k2-thinking": {
    name: "Kimi K2 Thinking",
    author: "canopywave",
    description:
      "The Moonshot AI's most advanced open reasoning model to date, extending the K2 series into agentic, long-horizon reasoning.",
    contextLength: 256_000,
    maxOutputTokens: 262_144,
    created: "2025-01-06T00:00:00.000Z",
    modality: {
      inputs: ["text"],
      outputs: ["text"],
    },
    tokenizer: "MoonshotAI",
  },
} satisfies Record<string, ModelConfig>;

export type CanopyWaveModelName = keyof typeof models;
