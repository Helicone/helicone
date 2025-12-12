import type { ModelConfig } from "../../../types";

export const models = {
  "gpt-5": {
    name: "OpenAI GPT-5",
    author: "openai",
    description:
      "GPT-5 is OpenAI's most advanced language model, featuring enhanced reasoning capabilities with 80% fewer factual errors than o3. It supports a 400K total context (272K input + 128K output), advanced tool calling with reliable chaining of dozens of calls, and a new verbosity parameter for response length control. Ideal for complex reasoning, multi-step planning, and applications requiring high accuracy.",
    contextLength: 400000,
    maxOutputTokens: 128000,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
    stripeModelId: "gpt-5",
  },
  "gpt-5-mini": {
    name: "OpenAI GPT-5 Mini",
    author: "openai",
    description:
      "GPT-5 Mini delivers GPT-5-level performance at a fraction of the cost and latency. With the same 400K context window and advanced capabilities including tool calling and verbosity control, it's optimized for speed and efficiency while maintaining strong reasoning and instruction-following capabilities. Perfect for high-volume applications requiring advanced AI capabilities with resource constraints.",
    contextLength: 400000,
    maxOutputTokens: 128000,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
    stripeModelId: "gpt-5-mini",
  },
  "gpt-5-nano": {
    name: "OpenAI GPT-5 Nano",
    author: "openai",
    description:
      "GPT-5 Nano is the smallest and fastest model in the GPT-5 family, designed for ultra-low latency applications. Despite its compact size, it maintains the full 400K context window and delivers impressive performance on classification, completion, and simple reasoning tasks. Ideal for real-time applications, edge deployments, and high-throughput scenarios.",
    contextLength: 400000,
    maxOutputTokens: 128000,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
    stripeModelId: "gpt-5-nano",
  },
  "gpt-5-chat-latest": {
    name: "OpenAI GPT-5 Chat Latest",
    author: "openai",
    description:
      "GPT-5 Chat Latest is a continuously updated version of GPT-5 optimized for conversational interactions. It receives regular updates with the latest improvements in dialogue management, safety, and helpfulness. Features a 128K context window and 16K max output tokens, making it ideal for focused conversations. Knowledge cutoff: September 30, 2024.",
    contextLength: 128000,
    maxOutputTokens: 16384,
    created: "2024-09-30T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "gpt-5-pro": {
    name: "OpenAI: GPT-5 Pro",
    author: "openai",
    description: "Most capable GPT-5 model with extended thinking capabilities",
    contextLength: 128000,
    maxOutputTokens: 32768,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "gpt-5-codex": {
    name: "OpenAI: GPT-5 Codex",
    author: "openai",
    description: "Specialized model for code generation and analysis",
    contextLength: 400000,
    maxOutputTokens: 128000,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type GPT5ModelName = keyof typeof models;
