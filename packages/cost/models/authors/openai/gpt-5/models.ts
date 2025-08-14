import type { Model } from "../../../types";

export const models = {
  "gpt-5": {
    name: "OpenAI: GPT-5",
    author: "openai",
    description:
      "The best model for coding and agentic tasks across domains. GPT-5 is our flagship model for coding, reasoning, and agentic tasks across domains with reasoning token support. Knowledge cutoff: Sep 30, 2024.",
    contextLength: 400000,
    maxOutputTokens: 128000,
    created: "2025-08-07T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "GPT",
  },
  "gpt-5-mini": {
    name: "OpenAI: GPT-5 Mini",
    author: "openai",
    description:
      "A faster, cost-efficient version of GPT-5 for well-defined tasks. GPT-5 mini is a faster, more cost-efficient version of GPT-5. It's great for well-defined tasks and precise prompts. Knowledge cutoff: May 31, 2024.",
    contextLength: 400000,
    maxOutputTokens: 128000,
    created: "2025-08-07T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "GPT",
  },
  "gpt-5-nano": {
    name: "OpenAI: GPT-5 Nano",
    author: "openai",
    description:
      "Fastest, most cost-efficient version of GPT-5. GPT-5 Nano is our fastest, cheapest version of GPT-5. It's great for summarization and classification tasks. Knowledge cutoff: May 31, 2024.",
    contextLength: 400000,
    maxOutputTokens: 128000,
    created: "2025-08-07T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "GPT",
  },
} satisfies Record<string, Model>;