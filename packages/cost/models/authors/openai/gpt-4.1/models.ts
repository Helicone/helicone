import type { ModelConfig } from "../../../types";

export const models = {
  "gpt-4.1": {
    name: "OpenAI GPT-4.1",
    author: "openai",
    description:
      "GPT-4.1 is a flagship large language model optimized for advanced instruction following, real-world software engineering, and long-context reasoning. It supports a 1 million token context window and outperforms GPT-4o and GPT-4.5 across coding (54.6% SWE-bench Verified), instruction compliance (87.4% IFEval), and multimodal understanding benchmarks. It is tuned for precise code diffs, agent reliability, and high recall in large document contexts, making it ideal for agents, IDE tooling, and enterprise knowledge retrieval.",
    contextLength: 1047576,
    maxOutputTokens: 32768,
    created: "2025-04-14T17:23:05.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "gpt-4.1-mini": {
    name: "OpenAI GPT-4.1 Mini",
    author: "openai",
    description:
      "GPT-4.1 Mini is a mid-sized model delivering performance competitive with GPT-4o at substantially lower latency and cost. It retains a 1 million token context window and scores 45.1% on hard instruction evals, 35.8% on MultiChallenge, and 84.1% on IFEval. Mini also shows strong coding ability (e.g., 31.6% on Aider's polyglot diff benchmark) and vision understanding, making it suitable for interactive applications with tight performance constraints.",
    contextLength: 1047576,
    maxOutputTokens: 32768,
    created: "2025-04-14T17:23:01.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "gpt-4.1-nano": {
    name: "OpenAI GPT-4.1 Nano",
    author: "openai",
    description:
      "For tasks that demand low latency, GPT-4.1 nano is the fastest and cheapest model in the GPT-4.1 series. It delivers exceptional performance at a small size with its 1 million token context window, and scores 80.1% on MMLU, 50.3% on GPQA, and 9.8% on Aider polyglot coding – even higher than GPT-4o mini. It's ideal for tasks like classification or autocompletion.",
    contextLength: 1047576,
    maxOutputTokens: 32768,
    created: "2025-04-14T17:22:49.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "gpt-4.1-mini-2025-04-14": {
    name: "OpenAI GPT-4.1 Mini",
    author: "openai",
    description:
      "GPT-4.1 Mini is a mid-sized model delivering performance competitive with GPT-4o at substantially lower latency and cost. It retains a 1 million token context window and scores 45.1% on hard instruction evals, 35.8% on MultiChallenge, and 84.1% on IFEval. Mini also shows strong coding ability (e.g., 31.6% on Aider's polyglot diff benchmark) and vision understanding, making it suitable for interactive applications with tight performance constraints.",
    contextLength: 1047576,
    maxOutputTokens: 32768,
    created: "2025-04-14T17:23:01.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
    pinnedVersionOfModel: "gpt-4.1-mini",
  },
  "gpt-4.1-nano-2025-04-14": {
    name: "OpenAI GPT-4.1 Nano",
    author: "openai",
    description:
      "For tasks that demand low latency, GPT-4.1 nano is the fastest and cheapest model in the GPT-4.1 series. It delivers exceptional performance at a small size with its 1 million token context window, and scores 80.1% on MMLU, 50.3% on GPQA, and 9.8% on Aider polyglot coding – even higher than GPT-4o mini. It's ideal for tasks like classification or autocompletion.",
    contextLength: 1047576,
    maxOutputTokens: 32768,
    created: "2025-04-14T17:22:49.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
    pinnedVersionOfModel: "gpt-4.1-nano",
  },
} satisfies Record<string, ModelConfig>;

export type GPT41ModelName = keyof typeof models;
