import { ModelConfig } from "../../../types";

export const models = {
  "kimi-k3": {
    name: "Kimi K3",
    author: "moonshotai",
    description:
      "Kimi K3 is Moonshot AI's flagship multimodal model with a 1.1M token context window, unifying vision and text understanding with strong reasoning, coding, and agentic capabilities.",
    contextLength: 1_113_088,
    maxOutputTokens: 16_384,
    created: "2026-09-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "MoonshotAI",
  },
} satisfies Record<string, ModelConfig>;

export type KimiK3ModelName = keyof typeof models;
