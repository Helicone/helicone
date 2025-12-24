import type { ModelConfig } from "../../../types";

export const models = {
  "gpt-5.2": {
    name: "OpenAI GPT-5.2",
    author: "openai",
    description:
      "GPT-5.2 is our best general-purpose model, part of the GPT-5 flagship model family. Our most intelligent model yet for both general and agentic tasks, GPT-5.2 shows improvements over the previous GPT-5.1 in:\n- General intelligence\n- Instruction following\n- Accuracy and token efficiency\n- Multimodality—especially vision\n- Code generation—especially front-end UI creation\n- Tool calling and context management in the API\n- Spreadsheet understanding and creation\n- Unlike the previous GPT-5.1 model, GPT-5.2 has new features for managing what the model knows and remembers to improve accuracy.",
    contextLength: 400000,
    maxOutputTokens: 128000,
    created: "2025-12-11T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "gpt-5.2-2025-12-11": {
    name: "OpenAI GPT-5.2 (2025-12-11)",
    author: "openai",
    description:
      "GPT-5.2 is our best general-purpose model, part of the GPT-5 flagship model family. Our most intelligent model yet for both general and agentic tasks, GPT-5.2 shows improvements over the previous GPT-5.1 in:\n- General intelligence\n- Instruction following\n- Accuracy and token efficiency\n- Multimodality—especially vision\n- Code generation—especially front-end UI creation\n- Tool calling and context management in the API\n- Spreadsheet understanding and creation\n- Unlike the previous GPT-5.1 model, GPT-5.2 has new features for managing what the model knows and remembers to improve accuracy.",
    contextLength: 400000,
    maxOutputTokens: 128000,
    created: "2025-12-11T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "gpt-5.2-pro": {
    name: "OpenAI: GPT-5.2 Pro",
    author: "openai",
    description: "Tough problems that may take longer to solve but require harder thinking",
    contextLength: 400000,
    maxOutputTokens: 128000,
    created: "2025-12-11T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "gpt-5.2-chat-latest": {
    name: "OpenAI GPT-5.2 Chat",
    author: "openai",
    description:
      "GPT-5.2 Chat is a continuously updated version of GPT-5.2 optimized for conversational interactions. It receives regular updates with the latest improvements in dialogue management, safety, and helpfulness. Features a 128K context window and 16K max output tokens, making it ideal for focused conversations.",
    contextLength: 128000,
    maxOutputTokens: 16384,
    created: "2025-12-11T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type GPT52ModelName = keyof typeof models;
