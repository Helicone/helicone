import { ModelConfig } from "../../../types";

export const models = {
  "qwen3-32b": {
    name: "Qwen3-32B",
    author: "alibaba",
    description:
      "Qwen3-32B is a 32.8 billion parameter language model that uniquely supports seamless switching between thinking mode for complex reasoning tasks and non-thinking mode for efficient general dialogue within a single model. The model excels across 100+ languages with enhanced reasoning capabilities, superior human preference alignment, and strong agent-based task performance, supporting up to 131,072 tokens with YaRN extension.",
    contextLength: 131_072,
    maxOutputTokens: 40_960,
    created: "2025-04-28T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "qwen3-30b-a3b": {
    name: "Qwen3-30B-A3B",
    author: "qwen",
    description:
      "Qwen3 is the latest generation of large language models in Qwen series, offering a comprehensive suite of dense and mixture-of-experts (MoE) models. Built upon extensive training, Qwen3 delivers groundbreaking advancements in reasoning, instruction-following, agent capabilities, and multilingual support.",
    contextLength: 41_000,
    maxOutputTokens: 41_000,
    created: "2025-06-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Qwen",
  },
  "qwen3-coder": {
    name: "Qwen3-Coder-480B-A35B-Instruct-Turbo",
    author: "qwen",
    description:
      "Qwen3-Coder-480B-A35B-Instruct is the Qwen3's most agentic code model, featuring significant performance on agentic coding, agentic browser-use and other foundational coding tasks, achieving results comparable to Claude Sonnet. This model supports multimodal capabilities including text, images, audio, video, and audio-visual reasoning.",
    contextLength: 262_144,
    maxOutputTokens: 16_384,
    created: "2025-07-23T00:00:00.000Z",
    modality: {
      inputs: ["text", "image", "audio", "video"],
      outputs: ["text"],
    },
    tokenizer: "Qwen",
  },
  "qwen3-next-80b-a3b-instruct": {
    name: "Qwen3-Next-80B-A3B-Instruct",
    author: "qwen",
    description:
      "Qwen3-Next-80B-A3B-Instruct is a causal language model that is instruction-optimized for chat and agent applications. It features a Mixture-of-Experts (MoE) architecture that achieves an extremely low activation ratio, drastically reducing FLOPs per token while preserving model capacity. The model supports ultra-long contexts and has a Multi-Token Prediction (MTP) mechanism to boost performance and accelerate inference.",
    contextLength: 262_000,
    maxOutputTokens: 16_384,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text", "image", "video"], outputs: ["text"] },
    tokenizer: "Qwen",
  },
  "qwen3-235b-a22b-thinking": {
    name: "Qwen3-235B-A22B-Thinking",
    author: "qwen",
    description:
      "Qwen3-235B-A22B-Thinking-2507 is the Qwen3's new model with scaling the thinking capability of Qwen3-235B-A22B, improving both the quality and depth of reasoning.",
    contextLength: 262_144,
    maxOutputTokens: 81_920,
    created: "2025-07-25T00:00:00.000Z",
    modality: { inputs: ["text", "image", "video"], outputs: ["text"] },
    tokenizer: "Qwen",
  },
  "qwen3-vl-235b-a22b-instruct": {
    name: "Qwen3 VL 235B A22B Instruct",
    author: "alibaba",
    description:
      "Qwen3 VL 235B A22B Instruct is a powerful, open-weight multimodal model from Alibaba Cloud that excels at both language and vision tasks. It integrates strong text generation with advanced visual understanding of images and video, enabling applications like visual question answering, document parsing, chart extraction, and multilingual OCR. Key features include robust perception, spatial and long-form video comprehension, and the ability to follow complex instructions in multi-turn dialogues. This model also supports agentic interactions and tool use, including visual coding and GUI automation. ",
    contextLength: 256_000,
    maxOutputTokens: 16_384,
    created: "2025-09-23T00:00:00.000Z",
    modality: { inputs: ["text", "image", "video"], outputs: ["text"] },
    tokenizer: "Qwen",
  },
} satisfies Record<string, ModelConfig>;

export type Qwen3ModelName = keyof typeof models;
