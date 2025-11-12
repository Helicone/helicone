import { ModelConfig } from "../../../types";

export const models = {
  "kimi-k2-0711": {
    name: "Kimi K2 (07/11)",
    author: "moonshotai",
    description:
      "Kimi K2 Instruct is a large-scale Mixture-of-Experts (MoE) language model developed by Moonshot AI, featuring 1 trillion total parameters with 32 billion active per forward pass. It is optimized for agentic capabilities, including advanced tool use, reasoning, and code synthesis. Kimi K2 excels across a broad range of benchmarks, particularly in coding (LiveCodeBench, SWE-bench), reasoning (ZebraLogic, GPQA), and tool-use (Tau2, AceBench) tasks. It supports long-context inference up to 128K tokens and is designed with a novel training stack that includes the MuonClip optimizer for stable large-scale MoE training.",
    contextLength: 131_072,
    maxOutputTokens: 16_384,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "kimi-k2-0905": {
    name: "Kimi K2 (09/05)",
    author: "moonshotai",
    description:
      "Enhanced version of Kimi K2 with doubled context window (256k tokens) and significantly improved coding capabilities, especially for frontend development. Features superior performance on public benchmarks (69.2% on SWE-bench Verified) and more polished code generation for web and 3D scenarios.\n\nKey Improvements\n2x Context Window: Increased from 128k to 256k tokens for better long-horizon task support.\nEnhanced Coding: Specialized training for frontend development, UI code generation, and tool calling.\nAgentic Capabilities: Improved reliability for code generation rivaling frontier closed models.",
    contextLength: 262_144,
    maxOutputTokens: 16_384,
    created: "2025-09-05T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  }
} satisfies Record<string, ModelConfig>;

export type KimiK2ModelName = keyof typeof models;
