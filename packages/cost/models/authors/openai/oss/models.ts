import { ModelConfig } from "../../../types";

export const models = {
  "gpt-oss-120b": {
    name: "OpenAI: gpt-oss-120b",
    author: "openai",
    description:
      "gpt-oss-120b is our most powerful open-weight model, which fits into a single H100 GPU (117B parameters with 5.1B active parameters). Features permissive Apache 2.0 license, configurable reasoning effort (low, medium, high), full chain-of-thought access, fine-tunable parameters, and agentic capabilities including function calling, web browsing, Python code execution, and structured outputs.",
    contextLength: 131072,
    maxOutputTokens: 131072,
    created: "2024-06-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "gpt-oss-20b": {
    name: "OpenAI: gpt-oss-20b",
    author: "openai",
    description:
      "gpt-oss-20b is our medium-sized open-weight model for low latency, local, or specialized use-cases (21B parameters with 3.6B active parameters). Features permissive Apache 2.0 license, configurable reasoning effort (low, medium, high), full chain-of-thought access, fine-tunable parameters, and agentic capabilities including function calling, web browsing, Python code execution, and structured outputs.",
    contextLength: 131072,
    maxOutputTokens: 131072,
    created: "2024-06-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type GPTOSSModelName = keyof typeof models;
