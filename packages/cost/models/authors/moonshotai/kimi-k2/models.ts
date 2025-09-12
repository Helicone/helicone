import { ModelConfig } from "../../../types";

export const models = {
  "moonshotai/Kimi-K2-Instruct": {
    name: "Kimi K2 Instruct (09/05/2025)",
    author: "moonshotai",
    description:
      "Kimi K2 is a state-of-the-art mixture-of-experts (MoE) language model with 32 billion activated parameters and 1 trillion total parameters.\nTrained with the Muon optimizer, Kimi K2 achieves exceptional performance across frontier knowledge, reasoning, and coding tasks while being meticulously optimized for agentic capabilities.\n\nKey Features\nLarge-Scale Training: Pre-trained a 1T parameter MoE model on 15.5T tokens with zero training instability.\nMuonClip Optimizer: We apply the Muon optimizer to an unprecedented scale, and develop novel optimization techniques to resolve instabilities while scaling up.\nAgentic Intelligence: Specifically designed for tool use, reasoning, and autonomous problem-solving.",
    contextLength: 262_144,
    maxOutputTokens: 16_384,
    created: "2025-09-05T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type KimiK2ModelName = keyof typeof models;
