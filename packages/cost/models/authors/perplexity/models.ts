import { ModelConfig } from "../../types";

export const models = {
  sonar: {
    name: "Perplexity Sonar",
    author: "perplexity",
    description:
      "Fast and accurate web-grounded chat model with real-time search capabilities. Ideal for general queries requiring up-to-date information from the web.",
    contextLength: 127000,
    maxOutputTokens: 4096,
    created: "2025-01-27T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "sonar-pro": {
    name: "Perplexity Sonar Pro",
    author: "perplexity",
    description:
      "Advanced web-grounded chat model with enhanced search quality and 200K context window. Best for complex queries requiring comprehensive web research.",
    contextLength: 200000,
    maxOutputTokens: 4096,
    created: "2025-01-27T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "sonar-reasoning": {
    name: "Perplexity Sonar Reasoning",
    author: "perplexity",
    description:
      "Web-grounded reasoning model that thinks step-by-step before responding. Combines search capabilities with logical reasoning for accurate, well-reasoned answers.",
    contextLength: 127000,
    maxOutputTokens: 4096,
    created: "2025-01-27T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "sonar-reasoning-pro": {
    name: "Perplexity Sonar Reasoning Pro",
    author: "perplexity",
    description:
      "Advanced reasoning model with 128K context window designed for complex, multi-step queries. Provides in-depth analysis with web-grounded research and logical reasoning.",
    contextLength: 127000,
    maxOutputTokens: 4096,
    created: "2025-01-27T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "sonar-deep-research": {
    name: "Perplexity Sonar Deep Research",
    author: "perplexity",
    description:
      "Specialized research model that conducts comprehensive multi-query searches with citation tracking and reasoning tokens. Automatically determines search depth needed for thorough investigation.",
    contextLength: 127000,
    maxOutputTokens: 4096,
    created: "2025-01-27T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type PerplexityModelName = keyof typeof models;
