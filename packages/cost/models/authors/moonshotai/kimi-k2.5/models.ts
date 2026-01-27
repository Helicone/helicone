import { ModelConfig } from "../../../types";

export const models = {
  "kimi-k2.5": {
    name: "Kimi K2.5",
    author: "moonshotai",
    description:
      "Kimi K2.5 is Moonshot AI's flagship agentic model and a new SOTA open model. Built on Kimi K2 with continued pretraining over approximately 15T mixed visual and text tokens, it unifies vision and text, thinking and non-thinking modes, and single-agent and multi-agent execution into one model. It delivers state-of-the-art visual coding capability and a self-directed agent swarm paradigm.",
    contextLength: 262_144,
    maxOutputTokens: 16_384,
    created: "2025-01-27T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "MoonshotAI",
  },
} satisfies Record<string, ModelConfig>;

export type KimiK25ModelName = keyof typeof models;
