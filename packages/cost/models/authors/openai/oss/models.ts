import { ModelConfig } from "../../../types";

export const models = {
  "gpt-oss-120b": {
    name: "OpenAI: gpt-oss-120b",
    author: "google",
    description:
      "gpt-oss-120b is an open-weight, 117B-parameter Mixture-of-Experts (MoE) language model from OpenAI designed for high-reasoning, agentic, and general-purpose production use cases. It activates 5.1B parameters per forward pass and is optimized to run on a single H100 GPU with native MXFP4 quantization. The model supports configurable reasoning depth, full chain-of-thought access, and native tool use, including function calling, browsing, and structured output generation.",
    contextLength: 131000,
    maxOutputTokens: 131000,
    created: "2025-08-05T10:17:11",
    modality: "text->text",
    tokenizer: "GPT",
  },
  "gpt-oss-20b": {
    name: "OpenAI: gpt-oss-20b",
    author: "google",
    description:
      "gpt-oss-20b is an open-weight 21B parameter model released by OpenAI under the Apache 2.0 license. It uses a Mixture-of-Experts (MoE) architecture with 3.6B active parameters per forward pass, optimized for lower-latency inference and deployability on consumer or single-GPU hardware. The model is trained in OpenAI’s Harmony response format and supports reasoning level configuration, fine-tuning, and agentic capabilities including function calling, tool use, and structured outputs.",
    contextLength: 131000,
    maxOutputTokens: 131000,
    created: "2025-08-05T10:17:09",
    modality: "text->text",
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type GPTOSSModelName = keyof typeof models;
