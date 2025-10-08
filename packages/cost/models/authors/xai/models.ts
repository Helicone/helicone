import { ModelConfig } from "../../types";

export const models = {
  "grok-code-fast-1": {
    name: "xAI: Grok Code Fast 1",
    author: "xai",
    description:
      "Speedy and economical reasoning model that excels at agentic coding. Features function calling, structured outputs, and reasoning capabilities.",
    contextLength: 256000,
    maxOutputTokens: 10000,
    created: "2024-08-25T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "Grok",
  },
  "grok-4": {
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
  "grok-4-fast-reasoning": {
    name: "xAI: Grok 4 Fast Reasoning",
    author: "xai",
    description:
      "Grok 4 Fast is xAI's latest advancement in cost-efficient reasoning models. Built on xAI’s learnings from Grok 4, Grok 4 Fast delivers frontier-level performance across Enterprise and Consumer domains—with exceptional token efficiency. This model pushes the boundaries for smaller and faster AI, making high-quality reasoning accessible to more users and developers. Grok 4 Fast features state-of-the-art (SOTA) cost-efficiency, cutting-edge web and X search capabilities, a 2M token context window, and a unified architecture that blends reasoning and non-reasoning modes in one model.",
    contextLength: 2_000_000,
    maxOutputTokens: 30_000,
    created: "2025-09-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
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
