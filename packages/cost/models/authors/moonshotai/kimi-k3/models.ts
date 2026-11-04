import { ModelConfig } from "../../../types";

export const models = {
  "kimi-k3": {
    name: "Kimi K3",
    author: "moonshotai",
    description:
      "Kimi K3 is Moonshot AI's flagship model for long-horizon coding and end-to-end knowledge work, with a 1M-token context window. It always reasons, with configurable reasoning effort, and supports automatic context caching, tool calls, JSON mode, structured output, tool choice constraints, and dynamically loaded tools.",
    contextLength: 1_048_576,
    maxOutputTokens: 1_048_576,
    created: "2026-07-16T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "MoonshotAI",
  },
} satisfies Record<string, ModelConfig>;

export type KimiK3ModelName = keyof typeof models;
