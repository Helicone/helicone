import { ModelConfig } from "../../types";

export const models = {
  "grok-code-fast-1": {
    name: "xAI: Grok Code Fast 1",
    author: "xai",
    description:
      "Speedy and economical reasoning model that excels at agentic coding. Features function calling, structured outputs, and reasoning capabilities.",
    contextLength: 256000,
    maxOutputTokens: 256000,
    created: "2024-08-25T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "Grok",
  },
  "grok-4-0709": {
    name: "xAI: Grok 4",
    author: "xai",
    description:
      "Latest and greatest flagship model, offering unparalleled performance in natural language, math and reasoning - the perfect jack of all trades. Features function calling, structured outputs, and reasoning capabilities.",
    contextLength: 256000,
    maxOutputTokens: 256000,
    created: "2024-07-09T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "Grok",
  },
  "grok-3": {
    name: "xAI: Grok 3",
    author: "xai",
    description:
      "Excels at enterprise use cases like data extraction, coding, and text summarization. Possesses deep domain knowledge in finance, healthcare, law, and science. Features function calling, structured outputs, and reasoning capabilities.",
    contextLength: 131072,
    maxOutputTokens: 131072,
    created: "2024-06-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "Grok",
  },
  "grok-3-mini": {
    name: "xAI: Grok 3 Mini",
    author: "xai",
    description:
      "Lightweight model that thinks before responding. Fast, smart, and great for logic-based tasks that do not require deep domain knowledge. Features function calling, structured outputs, and reasoning capabilities.",
    contextLength: 131072,
    maxOutputTokens: 131072,
    created: "2024-06-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "Grok",
  },
} satisfies Record<string, ModelConfig>;

export type GrokModelName = keyof typeof models;