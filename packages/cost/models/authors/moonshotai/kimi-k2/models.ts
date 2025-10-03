import { ModelConfig } from "../../../types";

export const models = {
  "kimi-k2": {
    name: "Kimi K2 Instruct",
    author: "moonshotai",
    description:
      "Kimi K2 is a state-of-the-art mixture-of-experts (MoE) language model with 32 billion activated parameters and 1 trillion total parameters.\nTrained with the Muon optimizer, Kimi K2 achieves exceptional performance across frontier knowledge, reasoning, and coding tasks while being meticulously optimized for agentic capabilities.\n\nKey Features\nLarge-Scale Training: Pre-trained a 1T parameter MoE model on 15.5T tokens with zero training instability.\nMuonClip Optimizer: We apply the Muon optimizer to an unprecedented scale, and develop novel optimization techniques to resolve instabilities while scaling up.\nAgentic Intelligence: Specifically designed for tool use, reasoning, and autonomous problem-solving.",
    contextLength: 131_072,
    maxOutputTokens: 16_384,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "kimi-k2-0905": {
    name: "Kimi K2 Instruct (09/05)",
    author: "moonshotai",
    description:
      "Enhanced version of Kimi K2 with doubled context window (256k tokens) and significantly improved coding capabilities, especially for frontend development. Features superior performance on public benchmarks (69.2% on SWE-bench Verified) and more polished code generation for web and 3D scenarios.\n\nKey Improvements\n2x Context Window: Increased from 128k to 256k tokens for better long-horizon task support.\nEnhanced Coding: Specialized training for frontend development, UI code generation, and tool calling.\nAgentic Capabilities: Improved reliability for code generation rivaling frontier closed models.",
    contextLength: 262_144,
    maxOutputTokens: 16_384,
    created: "2025-09-05T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "kimi-k2-instruct": {
    name: "Kimi K2 Instruct",
    author: "moonshotai",
    description:
      "Kimi K2 is a state-of-the-art mixture-of-experts (MoE) language model with 32 billion activated parameters and 1 trillion total parameters. Trained with the Muon optimizer, Kimi K2 achieves exceptional performance across frontier knowledge, reasoning, and coding tasks while being meticulously optimized for agentic capabilities. Specifically designed for tool use, reasoning, and autonomous problem-solving.",
    contextLength: 131_072,
    maxOutputTokens: 131_072,
    // quantization: "fp8",
    created: "2025-09-28T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type KimiK2ModelName = keyof typeof models;
